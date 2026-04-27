import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type PressableProps,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/src/components/Wordmark';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { cardShadow, UI, useResponsiveLayout } from '@/src/theme/layout';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  const { palette } = useTheme();
  const layout = useResponsiveLayout(460);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: layout.sideInset,
            paddingTop: layout.isTablet ? 52 : 28,
            paddingBottom: 24,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 28, alignItems: layout.isTablet ? 'center' : 'flex-start' }}>
            <Wordmark size={layout.isTablet ? 38 : 34} stacked={layout.isTablet} tagline />
            <Text
              style={{
                color: palette.ink,
                fontFamily: FONTS.bodyBold,
                fontSize: layout.isTablet ? 30 : 26,
                marginTop: layout.isTablet ? 28 : 24,
                textAlign: layout.isTablet ? 'center' : 'left',
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: palette.ink2,
                fontFamily: FONTS.body,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 8,
                textAlign: layout.isTablet ? 'center' : 'left',
              }}
            >
              {subtitle}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: UI.radius.lg,
              padding: 18,
              borderWidth: 1,
              borderColor: palette.line,
              ...cardShadow(palette.dark),
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { palette } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={{
        backgroundColor: isDisabled ? palette.wash : palette.primary,
        paddingVertical: 15,
        borderRadius: UI.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontFamily: FONTS.bodySemibold, fontSize: 15 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function AuthTextButton({
  label,
  disabled,
  ...pressableProps
}: PressableProps & {
  label: string;
}) {
  const { palette } = useTheme();

  return (
    <Pressable {...pressableProps} disabled={disabled} hitSlop={10}>
      <Text
        style={{
          color: disabled ? palette.ink3 : palette.primary,
          fontFamily: FONTS.bodySemibold,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AuthMessage({
  tone,
  children,
}: PropsWithChildren<{
  tone: 'error' | 'info' | 'success';
}>) {
  const { palette } = useTheme();
  const color = tone === 'error' ? palette.accent2 : tone === 'success' ? palette.success : palette.ink2;

  return (
    <View
      style={{
        backgroundColor: palette.surface2,
        borderColor: tone === 'error' ? palette.accent2 : palette.line,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color, fontFamily: FONTS.body, fontSize: 13, lineHeight: 19 }}>
        {children}
      </Text>
    </View>
  );
}

export function AuthFooter({
  prompt,
  action,
}: {
  prompt: string;
  action: ReactNode;
}) {
  const { palette } = useTheme();

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 18 }}>
      <Text style={{ color: palette.ink2, fontFamily: FONTS.body, fontSize: 13 }}>
        {prompt}
      </Text>
      {action}
    </View>
  );
}
