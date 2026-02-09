import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import {
  extractClerkErrorDetails,
  isLikelyEmailVerificationIssue,
} from "@/src/modules/auth/utils/clerkErrors";

type SignInView =
  | "sign-in"
  | "request-reset-code"
  | "verify-reset-code"
  | "set-new-password";

function getAuthRouteParams(nextEmail: string, reset?: string) {
  const params: { email?: string; reset?: string } = {};
  const normalizedEmail = nextEmail.trim();

  if (normalizedEmail.length > 0) {
    params.email = normalizedEmail;
  }

  if (reset) {
    params.reset = reset;
  }

  return params;
}

export function SignInScreen() {
  const params = useLocalSearchParams<{ email?: string; reset?: string }>();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [view, setView] = useState<SignInView>("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVerificationRecovery, setShowVerificationRecovery] = useState(false);

  const isReady = authLoaded && signInLoaded;

  useEffect(() => {
    if (typeof params.email !== "string") {
      return;
    }

    const normalizedEmail = params.email.trim();
    if (!normalizedEmail) {
      return;
    }

    setEmail((currentEmail) => (currentEmail.length > 0 ? currentEmail : normalizedEmail));
  }, [params.email]);

  useEffect(() => {
    if (params.reset !== "1" && params.reset !== "true") {
      return;
    }

    setView((currentView) =>
      currentView === "sign-in" ? "request-reset-code" : currentView,
    );
  }, [params.reset]);

  const clearMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setShowVerificationRecovery(false);
  };

  const completeSession = async (createdSessionId: string | null) => {
    if (!createdSessionId) {
      setErrorMessage("Sign-in completed but no session was returned.");
      return;
    }

    if (!setActive) {
      setErrorMessage("Sign-in completed but session activation is unavailable.");
      return;
    }

    await setActive({ session: createdSessionId });
    router.replace("/(tabs)");
  };

  const returnToSignIn = () => {
    clearMessages();
    setView("sign-in");
    setPassword("");
    setResetCode("");
    setNewPassword("");
  };

  const onSignIn = async () => {
    if (!signInLoaded) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await completeSession(result.createdSessionId);
        return;
      }

      if (result.status === "needs_new_password") {
        setView("set-new-password");
        setInfoMessage("Set a new password to complete sign-in.");
        return;
      }

      const hasEmailCodeStep = result.supportedFirstFactors?.some(
        (factor) => factor.strategy === "email_code",
      );

      if (result.status === "needs_first_factor" && hasEmailCodeStep) {
        setShowVerificationRecovery(true);
        setErrorMessage(
          "This account still needs an email verification step. Continue verification or reset your password.",
        );
        return;
      }

      setErrorMessage(`Additional sign-in steps are required (${result.status}).`);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Sign-in failed.");
      if (details.code === "form_identifier_not_found") {
        setErrorMessage("No account found for that email.");
      } else if (details.code === "form_password_incorrect") {
        setErrorMessage("Incorrect password. Use Forgot Password to reset it.");
      } else {
        setErrorMessage(details.message);
      }

      setShowVerificationRecovery(isLikelyEmailVerificationIssue(details));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestResetCode = async () => {
    if (!signInLoaded) {
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("Enter your account email first.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const resetSignIn = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: normalizedEmail,
      });

      const resetFactor = resetSignIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code",
      );
      if (
        !resetFactor ||
        !("emailAddressId" in resetFactor) ||
        typeof resetFactor.emailAddressId !== "string"
      ) {
        setErrorMessage("Password reset is not available for this account.");
        return;
      }

      const emailAddressId = resetFactor.emailAddressId;
      await resetSignIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId,
      });

      setView("verify-reset-code");
      setInfoMessage("We sent a password reset code to your email.");
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Unable to send reset code.");
      if (details.code === "form_identifier_not_found") {
        setErrorMessage("No account found for that email.");
      } else {
        setErrorMessage(details.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyResetCode = async () => {
    if (!signInLoaded) {
      return;
    }

    const normalizedCode = resetCode.trim();
    if (!normalizedCode) {
      setErrorMessage("Enter the reset code from your email.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const verificationResult = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: normalizedCode,
      });

      if (verificationResult.status === "complete") {
        await completeSession(verificationResult.createdSessionId);
        return;
      }

      if (verificationResult.status === "needs_new_password") {
        setView("set-new-password");
        setInfoMessage("Code verified. Set your new password.");
        return;
      }

      setErrorMessage(`Unable to verify code (${verificationResult.status}).`);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Invalid or expired reset code.");
      setErrorMessage(details.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSetNewPassword = async () => {
    if (!signInLoaded) {
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Use at least 8 characters for your new password.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const resetResult = await signIn.resetPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });

      if (resetResult.status === "complete") {
        await completeSession(resetResult.createdSessionId);
        return;
      }

      setErrorMessage(`Password reset could not finish (${resetResult.status}).`);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Unable to set a new password.");
      setErrorMessage(details.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading authentication...</AppText>
        </View>
      </Screen>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen>
      <Card>
        <AppText variant="overline" color={theme.colors.primary}>
          Make Waves
        </AppText>
        <AppText variant="h1" color={theme.colors.heading}>
          {view === "sign-in" ? "Sign in" : "Reset password"}
        </AppText>
        <AppText>
          {view === "sign-in"
            ? "Access event hosting, discovery, and your impact schedule."
            : "Recover your account access with an email reset code."}
        </AppText>
      </Card>

      <Card>
        {view === "sign-in" ? (
          <>
            <TextField
              label="Email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <TextField
              label="Password"
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              value={password}
            />
          </>
        ) : null}

        {view === "request-reset-code" ? (
          <TextField
            label="Account email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
        ) : null}

        {view === "verify-reset-code" ? (
          <TextField
            label="Reset code"
            onChangeText={setResetCode}
            placeholder="Enter code from email"
            value={resetCode}
          />
        ) : null}

        {view === "set-new-password" ? (
          <TextField
            label="New password"
            onChangeText={setNewPassword}
            placeholder="Use a strong password"
            secureTextEntry
            value={newPassword}
          />
        ) : null}

        {infoMessage ? <AppText color={theme.colors.primary}>{infoMessage}</AppText> : null}
        {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}

        {view === "sign-in" ? (
          <>
            <Button label="Sign In" loading={isSubmitting} onPress={onSignIn} />
            <Button
              label="Forgot Password"
              onPress={() => {
                clearMessages();
                setView("request-reset-code");
              }}
              variant="ghost"
            />
            {showVerificationRecovery ? (
              <Button
                label="Continue Email Verification"
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/sign-up",
                    params: getAuthRouteParams(email),
                  })
                }
                variant="secondary"
              />
            ) : null}
            <Button
              label="Create an Account"
              onPress={() =>
                router.push({
                  pathname: "/(auth)/sign-up",
                  params: getAuthRouteParams(email),
                })
              }
              variant="secondary"
            />
          </>
        ) : null}

        {view === "request-reset-code" ? (
          <>
            <Button label="Send Reset Code" loading={isSubmitting} onPress={onRequestResetCode} />
            <Button label="Back to Sign In" onPress={returnToSignIn} variant="secondary" />
          </>
        ) : null}

        {view === "verify-reset-code" ? (
          <>
            <Button label="Verify Code" loading={isSubmitting} onPress={onVerifyResetCode} />
            <Button label="Resend Code" onPress={onRequestResetCode} variant="ghost" />
            <Button label="Back to Sign In" onPress={returnToSignIn} variant="secondary" />
          </>
        ) : null}

        {view === "set-new-password" ? (
          <>
            <Button
              label="Set New Password"
              loading={isSubmitting}
              onPress={onSetNewPassword}
            />
            <Button label="Back to Sign In" onPress={returnToSignIn} variant="secondary" />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
});
