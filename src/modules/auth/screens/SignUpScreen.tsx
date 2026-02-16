import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
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

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

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

function normalizeHandleInput(handle: string) {
  return handle.trim().toLowerCase().replace(/^@+/, "");
}

function getProfileValidationError(displayName: string, handle: string) {
  if (displayName.trim().length < 2) {
    return "Display name must be at least 2 characters.";
  }

  const normalizedHandle = normalizeHandleInput(handle);
  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    return "Handle must be 3-24 characters using lowercase letters, numbers, underscores, or hyphens.";
  }

  return null;
}

export function SignUpScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const syncCurrentUser = useMutation(api.viewer.syncCurrentUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [suppressSignedInRedirect, setSuppressSignedInRedirect] = useState(false);
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

    const validationError = getProfileValidationError(displayName, handle);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

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
        setSuppressSignedInRedirect(true);
        await setActive({ session: result.createdSessionId });
        setPendingVerification(false);
        setNeedsProfileSetup(true);
        setInfoMessage("Email verified. Finish your profile to continue.");
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

  const onCompleteProfileSetup = async () => {
    clearMessages();
    const normalizedHandle = normalizeHandleInput(handle);
    const trimmedDisplayName = displayName.trim();
    const validationError = getProfileValidationError(trimmedDisplayName, normalizedHandle);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await syncCurrentUser({
        displayName: trimmedDisplayName,
        handle: normalizedHandle,
        email: email.trim() || undefined,
      });
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not finish profile setup.");
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

  if (isSignedIn && !suppressSignedInRedirect) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.layout}>
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <AppText variant="caption" color={theme.colors.muted}>
              Make Waves
            </AppText>
            <AppText variant="h2" color={theme.colors.heading}>
              {needsProfileSetup
                ? "Finish your profile"
                : pendingVerification
                  ? "Verify your email"
                  : "Create account"}
            </AppText>
            <AppText variant="caption">
              {needsProfileSetup
                ? "Set your name and @handle so people can find you."
                : pendingVerification
                  ? "Enter the code we sent to your inbox."
                  : "Use your email and password to get started."}
            </AppText>
          </View>

          <View style={styles.formStack}>
            {needsProfileSetup ? (
              <>
                <TextField
                  label="Display name"
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  value={displayName}
                />
                <TextField
                  label="Handle"
                  onChangeText={(nextHandle) => setHandle(normalizeHandleInput(nextHandle))}
                  placeholder="@makewaves_member"
                  value={handle}
                />
              </>
            ) : pendingVerification ? (
              <TextField
                label="Verification code"
                onChangeText={setVerificationCode}
                placeholder="Enter email code"
                value={verificationCode}
              />
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
                  placeholder="Use at least 8 characters"
                  secureTextEntry
                  value={password}
                />
                <TextField
                  label="Display name"
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  value={displayName}
                />
                <TextField
                  label="Handle"
                  onChangeText={(nextHandle) => setHandle(normalizeHandleInput(nextHandle))}
                  placeholder="@makewaves_member"
                  value={handle}
                />
              </>
            )}
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
            {needsProfileSetup ? (
              <Button
                label="Finish Setup"
                loading={isSubmitting}
                onPress={onCompleteProfileSetup}
              />
            ) : pendingVerification ? (
              <>
                <Button label="Verify Email" loading={isSubmitting} onPress={onVerifyEmail} />
                <Button label="Resend Code" onPress={onResendVerification} variant="ghost" />
              </>
            ) : (
              <>
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

            {!needsProfileSetup ? (
              <Button
                label="Back to Sign In"
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/sign-in",
                    params: getAuthRouteParams(email),
                  })
                }
                variant="ghost"
              />
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
