// app/(auth)/sign-up.tsx — Clerk email + password sign-up.

import { isClerkAPIResponseError, useSignUp } from '@clerk/expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  AuthButton,
  AuthFooter,
  AuthMessage,
  AuthScreen,
  AuthTextButton,
} from '@/src/components/AuthForm';
import { FieldInput, FormField } from '@/src/components/FormField';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

function authError(err: unknown, fallback: string) {
  return isClerkAPIResponseError(err)
    ? err.errors[0]?.longMessage ?? err.errors[0]?.message ?? fallback
    : err instanceof Error
      ? err.message
      : fallback;
}

export default function SignUpScreen() {
  const { palette } = useTheme();
  const { fetchStatus, signUp } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || fetchStatus === 'fetching';
  const cleanEmail = email.trim();
  const canCreate = cleanEmail.length > 2 && password.length >= 8 && !busy;
  const canVerify = code.trim().length > 0 && !busy;

  const clearFeedback = () => {
    setError(null);
    setNotice(null);
  };

  const createAccount = async () => {
    if (!canCreate) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const created = await signUp.password({
        emailAddress: cleanEmail,
        password,
      });
      if (created.error) throw created.error;

      const verification = await signUp.verifications.sendEmailCode();
      if (verification.error) throw verification.error;

      setCode('');
      setPendingVerification(true);
      setNotice(`We sent a verification code to ${cleanEmail}.`);
    } catch (err: unknown) {
      setError(authError(err, 'Could not create account'));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    if (!canVerify) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (result.error) throw result.error;

      if (signUp.status !== 'complete') {
        throw new Error(`Verification needs another step: ${signUp.status}`);
      }

      await signUp.finalize();
    } catch (err: unknown) {
      setError(authError(err, 'Could not verify email'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    clearFeedback();
    setSubmitting(true);
    try {
      const verification = await signUp.verifications.sendEmailCode();
      if (verification.error) throw verification.error;
      setNotice(`We sent a new code to ${cleanEmail}.`);
    } catch (err: unknown) {
      setError(authError(err, 'Could not resend the code'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title={pendingVerification ? 'Check your email' : 'Create your account'}
      subtitle={
        pendingVerification
          ? 'Enter the code we sent so we can finish setting up your account.'
          : 'Join volunteer events around West Palm Beach and keep your impact in one place.'
      }
    >
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      {notice && <AuthMessage tone="success">{notice}</AuthMessage>}

      {pendingVerification ? (
        <>
          <FormField label="Verification code">
            <FieldInput
              autoCapitalize="none"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              placeholder="123456"
              value={code}
              onChangeText={(value) => {
                setCode(value);
                clearFeedback();
              }}
            />
          </FormField>

          <AuthButton
            label="Verify and continue"
            loading={submitting}
            disabled={!canVerify}
            onPress={verifyEmail}
          />

          <View style={{ alignItems: 'center', gap: 14, marginTop: 16 }}>
            <AuthTextButton label="Resend code" onPress={resendCode} disabled={busy} />
            <AuthTextButton
              label="Use a different email"
              disabled={busy}
              onPress={() => {
                setPendingVerification(false);
                setCode('');
                clearFeedback();
              }}
            />
          </View>
        </>
      ) : (
        <>
          <FormField label="Email">
            <FieldInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearFeedback();
              }}
            />
          </FormField>
          <FormField label="Password">
            <FieldInput
              autoCapitalize="none"
              secureTextEntry
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearFeedback();
              }}
            />
          </FormField>

          <Text
            style={{
              color: palette.ink3,
              fontFamily: FONTS.body,
              fontSize: 12,
              lineHeight: 18,
              marginTop: -8,
              marginBottom: 16,
            }}
          >
            Use 8 or more characters.
          </Text>

          <AuthButton
            label="Create account"
            loading={submitting}
            disabled={!canCreate}
            onPress={createAccount}
          />

          <AuthFooter
            prompt="Already have an account?"
            action={(
              <Link href="/sign-in" asChild>
                <AuthTextButton label="Sign in" />
              </Link>
            )}
          />
        </>
      )}

      {/* Required for sign-up flows. Clerk renders bot protection here when needed. */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}
