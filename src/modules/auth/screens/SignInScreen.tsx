import { useAuth, useSignIn } from "@clerk/clerk-expo";
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

  return "Sign-in failed.";
}

export function SignInScreen() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReady = authLoaded && signInLoaded;

  const onSignIn = async () => {
    if (!signInLoaded) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setErrorMessage(`Additional sign-in steps are required (${result.status}).`);
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
          Sign in
        </AppText>
        <AppText>Access event hosting, discovery, and your impact schedule.</AppText>
      </Card>

      <Card>
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
        {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}
        <Button label="Sign In" loading={isSubmitting} onPress={onSignIn} />
        <Button
          label="Create an Account"
          onPress={() => router.push("/(auth)/sign-up")}
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
