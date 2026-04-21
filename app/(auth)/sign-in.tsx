// app/(auth)/sign-in.tsx — email + password sign-in with Apple/Google OAuth.

import { useAuthActions } from '@convex-dev/auth/react';
import { Link } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldInput, FormField } from '@/src/components/FormField';
import { Wordmark } from '@/src/components/Wordmark';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

export default function SignInScreen() {
  const { palette } = useTheme();
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.length > 2 && password.length >= 6 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await signIn('password', { email, password, flow: 'signIn' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      Alert.alert('Sign-in failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const onApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token from Apple.');
      }
      await signIn('apple', { idToken: credential.identityToken });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('canceled')) return;
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      Alert.alert('Apple sign-in failed', message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 24,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Wordmark size={32} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: palette.ink2,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Volunteer for the good deeds near you.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              padding: 20,
              borderWidth: 0.5,
              borderColor: palette.line,
            }}
          >
            <FormField label="Email">
              <FieldInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
              />
            </FormField>
            <FormField label="Password">
              <FieldInput
                autoCapitalize="none"
                secureTextEntry
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
              />
            </FormField>

            <Pressable
              disabled={!canSubmit}
              onPress={onSubmit}
              style={{
                marginTop: 4,
                backgroundColor: canSubmit ? palette.primary : palette.wash,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontFamily: FONTS.bodySemibold, fontSize: 15 }}>
                  Sign in
                </Text>
              )}
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
              <Text style={{ color: palette.ink2, fontFamily: FONTS.body, fontSize: 13 }}>
                New here?
              </Text>
              <Link href="/sign-up" asChild>
                <Pressable>
                  <Text style={{ color: palette.primary, fontFamily: FONTS.bodySemibold, fontSize: 13 }}>
                    Create an account
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {Platform.OS === 'ios' && (
            <View style={{ marginTop: 20 }}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={14}
                style={{ height: 48 }}
                onPress={onApple}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
