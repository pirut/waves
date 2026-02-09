import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";

function extractErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors) &&
    typeof (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message ===
      "string"
  ) {
    return (error as { errors: Array<{ message: string }> }).errors[0].message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Sign-up failed.";
}

export function SignUpScreen() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReady = authLoaded && signUpLoaded;

  const onCreateAccount = async () => {
    if (!signUpLoaded) {
      return;
    }

    setErrorMessage(null);
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
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyEmail = async () => {
    if (!signUpLoaded) {
      return;
    }

    setErrorMessage(null);
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
      setErrorMessage(extractErrorMessage(error));
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
            <TextField
              label="Verification code"
              onChangeText={setVerificationCode}
              placeholder="Enter email code"
              value={verificationCode}
            />
            {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}
            <Button
              label="Verify Email"
              loading={isSubmitting}
              onPress={onVerifyEmail}
            />
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
            {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}
            <Button
              label="Create Account"
              loading={isSubmitting}
              onPress={onCreateAccount}
            />
          </>
        )}

        <Button
          label="Back to Sign In"
          onPress={() => router.push("/(auth)/sign-in")}
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
