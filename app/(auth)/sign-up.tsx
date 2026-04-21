// app/(auth)/sign-up.tsx — email + password sign-up.

import { useAuthActions } from '@convex-dev/auth/react';
import { Link } from 'expo-router';
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

export default function SignUpScreen() {
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
      // Convex Auth Password provider uses `flow: 'signUp'` to create the user.
      await signIn('password', { email, password, flow: 'signUp' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-up failed';
      Alert.alert('Sign-up failed', message);
    } finally {
      setSubmitting(false);
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
              Start volunteering in your neighborhood.
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
                placeholder="At least 6 characters"
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
                  Create account
                </Text>
              )}
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 }}>
              <Text style={{ color: palette.ink2, fontFamily: FONTS.body, fontSize: 13 }}>
                Already have an account?
              </Text>
              <Link href="/sign-in" asChild>
                <Pressable>
                  <Text style={{ color: palette.primary, fontFamily: FONTS.bodySemibold, fontSize: 13 }}>
                    Sign in
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
