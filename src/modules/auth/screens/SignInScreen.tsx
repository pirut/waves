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
  isAlreadySignedInError,
  isLikelyEmailVerificationIssue,
} from "@/src/modules/auth/utils/clerkErrors";

type SignInView =
  | "sign-in"
  | "request-reset-code"
  | "verify-reset-code"
  | "set-new-password"
  | "verify-second-factor";

type SecondFactorStrategy = "totp" | "backup_code" | "phone_code" | "email_code";

type SignInResultLike = {
  createdSessionId?: string | null;
  status: string | null;
  supportedFirstFactors?: Array<{ strategy?: string }> | null;
  supportedSecondFactors?:
    | Array<{ safeIdentifier?: string; strategy?: string }>
    | null;
};

function getSupportedSecondFactorStrategies(
  secondFactors: SignInResultLike["supportedSecondFactors"],
) {
  const orderedStrategies: SecondFactorStrategy[] = [
    "totp",
    "phone_code",
    "email_code",
    "backup_code",
  ];

  return orderedStrategies.filter((candidateStrategy) =>
    secondFactors?.some((factor) => factor.strategy === candidateStrategy),
  );
}

function getSecondFactorInfoMessage(
  strategy: SecondFactorStrategy,
  safeIdentifier?: string,
) {
  if (strategy === "phone_code") {
    if (safeIdentifier) {
      return `A verification code was sent to ${safeIdentifier}.`;
    }

    return "A verification code was sent to your phone.";
  }

  if (strategy === "email_code") {
    if (safeIdentifier) {
      return `A verification code was sent to ${safeIdentifier}.`;
    }

    return "A verification code was sent to your email.";
  }

  if (strategy === "backup_code") {
    return "Enter one of your backup codes to finish signing in.";
  }

  return "Enter the code from your authenticator app to finish signing in.";
}

function getSecondFactorInputCopy(strategy: SecondFactorStrategy) {
  if (strategy === "backup_code") {
    return {
      label: "Backup code",
      placeholder: "Enter a backup code",
    };
  }

  if (strategy === "phone_code") {
    return {
      label: "Verification code",
      placeholder: "Enter the code from text message",
    };
  }

  if (strategy === "email_code") {
    return {
      label: "Verification code",
      placeholder: "Enter the code from your email",
    };
  }

  return {
    label: "Authenticator code",
    placeholder: "Enter the 6-digit code",
  };
}

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
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [secondFactorStrategy, setSecondFactorStrategy] =
    useState<SecondFactorStrategy>("totp");
  const [availableSecondFactors, setAvailableSecondFactors] = useState<SecondFactorStrategy[]>(
    [],
  );
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

  const navigateToSignIn = (message?: string) => {
    setView("sign-in");
    setPassword("");
    setResetCode("");
    setNewPassword("");
    setSecondFactorCode("");
    setSecondFactorStrategy("totp");
    setAvailableSecondFactors([]);
    setShowVerificationRecovery(false);
    setErrorMessage(null);
    setInfoMessage(message ?? null);
    router.replace({
      pathname: "/(auth)/sign-in",
      params: getAuthRouteParams(email),
    });
  };

  const returnToSignIn = () => {
    navigateToSignIn();
  };

  const beginSecondFactorVerification = async (
    supportedSecondFactors: SignInResultLike["supportedSecondFactors"],
    preferredStrategy?: SecondFactorStrategy,
  ) => {
    if (!signIn) {
      setErrorMessage("Authentication is not ready. Refresh and try signing in again.");
      return;
    }

    const strategies = getSupportedSecondFactorStrategies(supportedSecondFactors);

    if (strategies.length === 0) {
      setErrorMessage(
        "Your account requires a second factor, but no supported method is configured for this app.",
      );
      return;
    }

    const strategy =
      preferredStrategy && strategies.includes(preferredStrategy)
        ? preferredStrategy
        : strategies[0];
    const matchingFactor = supportedSecondFactors?.find(
      (factor) => factor.strategy === strategy,
    );

    if (strategy === "phone_code" || strategy === "email_code") {
      await signIn.prepareSecondFactor({ strategy });
    }

    setAvailableSecondFactors(strategies);
    setSecondFactorStrategy(strategy);
    setSecondFactorCode("");
    setView("verify-second-factor");
    setInfoMessage(getSecondFactorInfoMessage(strategy, matchingFactor?.safeIdentifier));
  };

  const handleSignInResult = async (result: SignInResultLike) => {
    if (!result.status) {
      setErrorMessage("Sign-in could not continue. Try again.");
      return;
    }

    if (result.status === "complete") {
      await completeSession(result.createdSessionId ?? null);
      return;
    }

    if (result.status === "needs_new_password") {
      setView("set-new-password");
      setInfoMessage("Set a new password to complete sign-in.");
      return;
    }

    if (result.status === "needs_second_factor") {
      await beginSecondFactorVerification(result.supportedSecondFactors);
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
  };

  const onSignIn = async () => {
    if (!signInLoaded || isSubmitting) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      await handleSignInResult(result);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Sign-in failed.");
      if (isAlreadySignedInError(details)) {
        try {
          await signOut();
          const retryResult = await signIn.create({
            identifier: email.trim(),
            password,
          });
          await handleSignInResult(retryResult);
          return;
        } catch (retryError) {
          const retryDetails = extractClerkErrorDetails(retryError, "Sign-in failed.");
          setErrorMessage(retryDetails.message);
          return;
        }

        return;
      }

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

  const onSwitchSecondFactor = async (strategy: SecondFactorStrategy) => {
    if (!signInLoaded || !signIn || isSubmitting) {
      return;
    }

    if (
      strategy === secondFactorStrategy &&
      strategy !== "phone_code" &&
      strategy !== "email_code"
    ) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      await beginSecondFactorVerification(signIn.supportedSecondFactors, strategy);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Unable to switch second factor.");
      setErrorMessage(details.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifySecondFactor = async () => {
    if (!signInLoaded || isSubmitting) {
      return;
    }

    const normalizedCode = secondFactorCode.trim();
    if (!normalizedCode) {
      setErrorMessage("Enter your second-factor code.");
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const verificationResult = await signIn.attemptSecondFactor({
        code: normalizedCode,
        strategy: secondFactorStrategy,
      });

      if (verificationResult.status === "complete") {
        await completeSession(verificationResult.createdSessionId ?? null);
        return;
      }

      if (verificationResult.status === "needs_second_factor") {
        await beginSecondFactorVerification(
          verificationResult.supportedSecondFactors,
          secondFactorStrategy,
        );
        return;
      }

      setErrorMessage(`Unable to verify second factor (${verificationResult.status}).`);
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Invalid second-factor code.");
      setErrorMessage(details.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestResetCode = async () => {
    if (!signInLoaded || isSubmitting) {
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
      if (!resetFactor) {
        setErrorMessage("Password reset is not available for this account.");
        return;
      }

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
    if (!signInLoaded || isSubmitting) {
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
    if (!signInLoaded || isSubmitting) {
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
        if (resetResult.createdSessionId) {
          await completeSession(resetResult.createdSessionId);
          return;
        }

        navigateToSignIn("Password updated. Sign in with your new password.");
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

  const hasBackupCodeOption = availableSecondFactors.includes("backup_code");
  const hasTotpOption = availableSecondFactors.includes("totp");
  const hasPhoneCodeOption = availableSecondFactors.includes("phone_code");
  const hasEmailCodeOption = availableSecondFactors.includes("email_code");
  const secondFactorInputCopy = getSecondFactorInputCopy(secondFactorStrategy);
  const isSignInView = view === "sign-in";
  const isSecondFactorView = view === "verify-second-factor";

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.layout}>
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <AppText variant="caption" color={theme.colors.muted}>
              Make Waves
            </AppText>
            <AppText variant="h2" color={theme.colors.heading}>
              {isSignInView
                ? "Sign in"
                : isSecondFactorView
                  ? "Two-step verification"
                  : "Reset password"}
            </AppText>
            <AppText variant="caption">
              {isSignInView
                ? "Use your email and password to continue."
                : isSecondFactorView
                  ? "Enter your verification code to continue."
                  : "Verify your code, then choose a new password."}
            </AppText>
          </View>

          <View style={styles.formStack}>
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
                  placeholder="Enter your password"
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
                placeholder="Use at least 8 characters"
                secureTextEntry
                value={newPassword}
              />
            ) : null}

            {view === "verify-second-factor" ? (
              <TextField
                label={secondFactorInputCopy.label}
                onChangeText={setSecondFactorCode}
                placeholder={secondFactorInputCopy.placeholder}
                value={secondFactorCode}
              />
            ) : null}
          </View>

          {infoMessage ? (
            <View style={[styles.messageBox, styles.infoBox]}>
              <AppText variant="caption" color={theme.colors.primaryDeep}>
                {infoMessage}
              </AppText>
            </View>
          ) : null}
          {errorMessage ? (
            <View style={[styles.messageBox, styles.errorBox]}>
              <AppText variant="caption" color={theme.colors.danger}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          <View style={styles.actionStack}>
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
                    variant="ghost"
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
                  variant="ghost"
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

            {view === "verify-second-factor" ? (
              <>
                <Button label="Verify and Sign In" loading={isSubmitting} onPress={onVerifySecondFactor} />
                {hasTotpOption && hasBackupCodeOption ? (
                  <Button
                    label={
                      secondFactorStrategy === "backup_code"
                        ? "Use Authenticator Code"
                        : "Use Backup Code"
                    }
                    onPress={() =>
                      onSwitchSecondFactor(
                        secondFactorStrategy === "backup_code" ? "totp" : "backup_code",
                      )
                    }
                    variant="ghost"
                  />
                ) : null}
                {hasPhoneCodeOption && secondFactorStrategy !== "phone_code" ? (
                  <Button
                    label="Use Text Message Code"
                    onPress={() => onSwitchSecondFactor("phone_code")}
                    variant="ghost"
                  />
                ) : null}
                {secondFactorStrategy === "phone_code" ? (
                  <Button
                    label="Resend Text Code"
                    onPress={() => onSwitchSecondFactor("phone_code")}
                    variant="ghost"
                  />
                ) : null}
                {hasEmailCodeOption && secondFactorStrategy !== "email_code" ? (
                  <Button
                    label="Use Email Code"
                    onPress={() => onSwitchSecondFactor("email_code")}
                    variant="ghost"
                  />
                ) : null}
                {secondFactorStrategy === "email_code" ? (
                  <Button
                    label="Resend Email Code"
                    onPress={() => onSwitchSecondFactor("email_code")}
                    variant="ghost"
                  />
                ) : null}
                <Button label="Back to Sign In" onPress={returnToSignIn} variant="secondary" />
              </>
            ) : null}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: "center",
    paddingBottom: theme.spacing.xl,
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  layout: {
    alignSelf: "center",
    maxWidth: 470,
    width: "100%",
  },
  formCard: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
  },
  formHeader: {
    gap: 4,
  },
  formStack: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  messageBox: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  infoBox: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
  },
  errorBox: {
    backgroundColor: "rgba(184, 90, 74, 0.08)",
    borderColor: "rgba(184, 90, 74, 0.22)",
  },
  actionStack: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
});
