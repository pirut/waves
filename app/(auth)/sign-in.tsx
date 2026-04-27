// app/(auth)/sign-in.tsx — Clerk email + password sign-in and password reset.

import { isClerkAPIResponseError, useSignIn } from '@clerk/expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  AuthFooter,
  AuthMessage,
  AuthScreen,
  AuthTextButton,
} from '@/src/components/AuthForm';
import { FieldInput, FormField } from '@/src/components/FormField';

type SignInStep = 'password' | 'device-code' | 'second-factor' | 'reset-email' | 'reset-password';
type SecondFactorStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';

function authError(err: unknown, fallback: string) {
  return isClerkAPIResponseError(err)
    ? err.errors[0]?.longMessage ?? err.errors[0]?.message ?? fallback
    : err instanceof Error
      ? err.message
      : fallback;
}

export default function SignInScreen() {
  const { fetchStatus, signIn } = useSignIn();

  const [step, setStep] = useState<SignInStep>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || fetchStatus === 'fetching';
  const cleanEmail = email.trim();
  const canSignIn = cleanEmail.length > 2 && password.length >= 8 && !busy;
  const canSendResetCode = cleanEmail.length > 2 && !busy;
  const canVerifyDevice = code.trim().length > 0 && !busy;
  const canVerifySecondFactor = code.trim().length > 0 && secondFactorStrategy !== null && !busy;
  const canResetPassword = code.trim().length > 0 && newPassword.length >= 8 && !busy;

  const clearFeedback = () => {
    setError(null);
    setNotice(null);
  };

  const finishSignIn = async () => {
    await signIn.finalize();
  };

  const signInWithPassword = async () => {
    if (!canSignIn) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const result = await signIn.password({
        emailAddress: cleanEmail,
        password,
      });
      if (result.error) throw result.error;

      if (signIn.status === 'complete') {
        await finishSignIn();
        return;
      }

      if (signIn.status === 'needs_client_trust') {
        const canUseEmailCode = signIn.supportedSecondFactors.some(
          (factor) => factor.strategy === 'email_code',
        );
        if (!canUseEmailCode) {
          throw new Error('This account needs an extra verification method that is not available here.');
        }
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) throw sent.error;
        setCode('');
        setStep('device-code');
        setNotice(`We sent a quick verification code to ${cleanEmail}.`);
        return;
      }

      if (signIn.status === 'needs_second_factor') {
        await beginSecondFactor();
        return;
      }

      throw new Error(`Sign-in needs another step: ${signIn.status}`);
    } catch (err: unknown) {
      setError(authError(err, 'Sign-in failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const beginSecondFactor = async () => {
    const strategies = signIn.supportedSecondFactors.map((factor) => factor.strategy);
    const preferred = (['email_code', 'phone_code', 'totp', 'backup_code'] as const)
      .find((strategy) => strategies.includes(strategy));

    if (!preferred) {
      throw new Error('This account needs a second sign-in factor that is not supported here yet.');
    }

    if (preferred === 'email_code') {
      const sent = await signIn.mfa.sendEmailCode();
      if (sent.error) throw sent.error;
      setNotice(`We sent a verification code to ${cleanEmail}.`);
    } else if (preferred === 'phone_code') {
      const sent = await signIn.mfa.sendPhoneCode();
      if (sent.error) throw sent.error;
      setNotice('We sent a verification code to your phone.');
    } else if (preferred === 'totp') {
      setNotice('Enter the 6-digit code from your authenticator app.');
    } else {
      setNotice('Enter one of your backup codes.');
    }

    setCode('');
    setSecondFactorStrategy(preferred);
    setStep('second-factor');
  };

  const verifyDevice = async () => {
    if (!canVerifyDevice) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const result = await signIn.mfa.verifyEmailCode({ code: code.trim() });
      if (result.error) throw result.error;
      if (signIn.status !== 'complete') {
        throw new Error(`Verification needs another step: ${signIn.status}`);
      }
      await finishSignIn();
    } catch (err: unknown) {
      setError(authError(err, 'Verification failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const verifySecondFactor = async () => {
    if (!canVerifySecondFactor) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const trimmedCode = code.trim();
      const result = secondFactorStrategy === 'email_code'
        ? await signIn.mfa.verifyEmailCode({ code: trimmedCode })
        : secondFactorStrategy === 'phone_code'
          ? await signIn.mfa.verifyPhoneCode({ code: trimmedCode })
          : secondFactorStrategy === 'totp'
            ? await signIn.mfa.verifyTOTP({ code: trimmedCode })
            : await signIn.mfa.verifyBackupCode({ code: trimmedCode });

      if (result.error) throw result.error;
      if (signIn.status !== 'complete') {
        throw new Error(`Verification needs another step: ${signIn.status}`);
      }
      await finishSignIn();
    } catch (err: unknown) {
      setError(authError(err, 'Verification failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const sendResetCode = async () => {
    if (!canSendResetCode) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const created = await signIn.create({ identifier: cleanEmail });
      if (created.error) throw created.error;

      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) throw sent.error;

      setCode('');
      setNewPassword('');
      setStep('reset-password');
      setNotice(`We sent a reset code to ${cleanEmail}.`);
    } catch (err: unknown) {
      setError(authError(err, 'Could not send a reset code'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!canResetPassword) return;
    clearFeedback();
    setSubmitting(true);
    try {
      const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (verified.error) throw verified.error;

      const submitted = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (submitted.error) throw submitted.error;

      if (signIn.status === 'complete') {
        await finishSignIn();
        return;
      }

      setPassword('');
      setNewPassword('');
      setCode('');
      setStep('password');
      setNotice('Password updated. Sign in with your new password.');
      await signIn.reset();
    } catch (err: unknown) {
      setError(authError(err, 'Could not reset password'));
    } finally {
      setSubmitting(false);
    }
  };

  const returnToPassword = async () => {
    clearFeedback();
    setStep('password');
    setCode('');
    setNewPassword('');
    setSecondFactorStrategy(null);
    await signIn.reset();
  };

  const heading = step === 'password'
    ? {
      title: 'Welcome back',
      subtitle: 'Sign in to find West Palm Beach volunteer events, save your plans, and keep your local impact moving.',
    }
    : step === 'reset-email'
      ? {
        title: 'Reset password',
        subtitle: 'Enter the email on your account and we will send a code.',
      }
      : step === 'reset-password'
        ? {
          title: 'Choose a new password',
          subtitle: 'Use the code from your email and set a password you will remember.',
        }
        : step === 'second-factor'
          ? {
            title: 'One more step',
            subtitle: secondFactorStrategy === 'totp'
              ? 'Enter the code from your authenticator app.'
              : secondFactorStrategy === 'backup_code'
                ? 'Enter one of your backup codes.'
                : 'Enter the verification code to finish signing in.',
          }
          : {
          title: 'Check your email',
          subtitle: 'This keeps your account protected when signing in from a new device.',
        };

  return (
    <AuthScreen title={heading.title} subtitle={heading.subtitle}>
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      {notice && <AuthMessage tone="success">{notice}</AuthMessage>}

      {step === 'password' && (
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
              placeholder="Your password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearFeedback();
              }}
            />
          </FormField>

          <View style={{ alignItems: 'flex-end', marginTop: -6, marginBottom: 16 }}>
            <AuthTextButton
              label="Forgot password?"
              onPress={() => {
                clearFeedback();
                setStep('reset-email');
              }}
            />
          </View>

          <AuthButton
            label="Sign in"
            loading={submitting}
            disabled={!canSignIn}
            onPress={signInWithPassword}
          />

          <AuthFooter
            prompt="New to Make Waves?"
            action={(
              <Link href="/sign-up" asChild>
                <AuthTextButton label="Create account" />
              </Link>
            )}
          />
        </>
      )}

      {step === 'device-code' && (
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
            disabled={!canVerifyDevice}
            onPress={verifyDevice}
          />

          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <AuthTextButton label="Back to sign in" onPress={returnToPassword} disabled={busy} />
          </View>
        </>
      )}

      {step === 'second-factor' && (
        <>
          <FormField label={secondFactorStrategy === 'backup_code' ? 'Backup code' : 'Verification code'}>
            <FieldInput
              autoCapitalize="none"
              autoComplete="one-time-code"
              keyboardType={secondFactorStrategy === 'backup_code' ? 'default' : 'number-pad'}
              placeholder={secondFactorStrategy === 'backup_code' ? 'Backup code' : '123456'}
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
            disabled={!canVerifySecondFactor}
            onPress={verifySecondFactor}
          />

          <View style={{ alignItems: 'center', gap: 14, marginTop: 16 }}>
            {(secondFactorStrategy === 'email_code' || secondFactorStrategy === 'phone_code') && (
              <AuthTextButton label="Resend code" onPress={beginSecondFactor} disabled={busy} />
            )}
            <AuthTextButton label="Back to sign in" onPress={returnToPassword} disabled={busy} />
          </View>
        </>
      )}

      {step === 'reset-email' && (
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

          <AuthButton
            label="Send reset code"
            loading={submitting}
            disabled={!canSendResetCode}
            onPress={sendResetCode}
          />

          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <AuthTextButton label="Back to sign in" onPress={returnToPassword} disabled={busy} />
          </View>
        </>
      )}

      {step === 'reset-password' && (
        <>
          <FormField label="Reset code">
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
          <FormField label="New password">
            <FieldInput
              autoCapitalize="none"
              secureTextEntry
              placeholder="At least 8 characters"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                clearFeedback();
              }}
            />
          </FormField>

          <AuthButton
            label="Reset and continue"
            loading={submitting}
            disabled={!canResetPassword}
            onPress={resetPassword}
          />

          <View style={{ alignItems: 'center', gap: 14, marginTop: 16 }}>
            <AuthTextButton label="Resend code" onPress={sendResetCode} disabled={busy} />
            <AuthTextButton label="Back to sign in" onPress={returnToPassword} disabled={busy} />
          </View>
        </>
      )}
    </AuthScreen>
  );
}
