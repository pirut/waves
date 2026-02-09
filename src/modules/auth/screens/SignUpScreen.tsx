import { useAuth, useSignUp } from "@clerk/clerk-expo";
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
  isIdentifierAlreadyInUseError,
} from "@/src/modules/auth/utils/clerkErrors";

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

export function SignUpScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExistingAccountRecovery, setShowExistingAccountRecovery] = useState(false);

  const isReady = authLoaded && signUpLoaded && !!signUp;

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
    if (!signUpLoaded || !signUp) {
      return;
    }

    const hasUnverifiedEmail =
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address");

    if (hasUnverifiedEmail && !pendingVerification) {
      setPendingVerification(true);
    }

    const pendingEmail = signUp.emailAddress;
    if (hasUnverifiedEmail && pendingEmail) {
      setEmail((currentEmail) => (currentEmail.length > 0 ? currentEmail : pendingEmail));
    }
  }, [
    pendingVerification,
    signUp?.emailAddress,
    signUp?.status,
    signUp?.unverifiedFields,
    signUpLoaded,
  ]);

  const clearMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const hasPendingEmailVerification =
    signUp?.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address");

  const onCreateAccount = async () => {
    if (!signUpLoaded || !signUp) {
      return;
    }

    clearMessages();
    setShowExistingAccountRecovery(false);
    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
      setInfoMessage("Verification code sent. Check your email.");
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Sign-up failed.");

      if (isIdentifierAlreadyInUseError(details.code)) {
        if (hasPendingEmailVerification) {
          try {
            await signUp.prepareEmailAddressVerification({
              strategy: "email_code",
            });
            setPendingVerification(true);
            setInfoMessage("A new verification code was sent to your email.");
            return;
          } catch (resendError) {
            const resendDetails = extractClerkErrorDetails(
              resendError,
              "This email already has an account.",
            );
            setErrorMessage(resendDetails.message);
          }
        } else {
          setErrorMessage(
            "This email already has an account. Sign in instead, or reset your password.",
          );
        }

        setShowExistingAccountRecovery(true);
      } else {
        setErrorMessage(details.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyEmail = async () => {
    if (!signUpLoaded || !signUp) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setErrorMessage(`Additional sign-up steps are required (${result.status}).`);
      }
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Verification failed.");
      setErrorMessage(details.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendVerification = async () => {
    if (!signUpLoaded || !signUp) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setInfoMessage("New verification code sent.");
    } catch (error) {
      const details = extractClerkErrorDetails(error, "Could not resend verification code.");
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
          Create account
        </AppText>
        <AppText>Join your community and start building measurable impact.</AppText>
      </Card>

      <Card>
        {pendingVerification ? (
          <>
            <AppText>Enter the verification code from your email.</AppText>
            <TextField
              label="Verification code"
              onChangeText={setVerificationCode}
              placeholder="Enter email code"
              value={verificationCode}
            />
            {infoMessage ? <AppText color={theme.colors.primary}>{infoMessage}</AppText> : null}
            {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}
            <Button label="Verify Email" loading={isSubmitting} onPress={onVerifyEmail} />
            <Button label="Resend Code" onPress={onResendVerification} variant="ghost" />
          </>
        ) : (
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
              placeholder="Use a strong password"
              secureTextEntry
              value={password}
            />
            {infoMessage ? <AppText color={theme.colors.primary}>{infoMessage}</AppText> : null}
            {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}
            <Button label="Create Account" loading={isSubmitting} onPress={onCreateAccount} />
            {showExistingAccountRecovery ? (
              <Button
                label="Reset Password Instead"
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/sign-in",
                    params: getAuthRouteParams(email, "1"),
                  })
                }
                variant="ghost"
              />
            ) : null}
          </>
        )}

        <Button
          label="Back to Sign In"
          onPress={() =>
            router.push({
              pathname: "/(auth)/sign-in",
              params: getAuthRouteParams(email),
            })
          }
          variant="secondary"
        />
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
