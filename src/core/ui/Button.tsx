import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: '#e6f6fb',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
});

const textColors: Record<ButtonVariant, string> = {
  primary: theme.colors.primaryText,
  secondary: theme.colors.primary,
  ghost: theme.colors.primary,
  danger: theme.colors.primaryText,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth = true,
}: Props) {
  const variantStyle = styles[variant] as ViewStyle;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        fullWidth ? { alignSelf: 'stretch' } : undefined,
        pressed ? { transform: [{ scale: 0.99 }] } : undefined,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <AppText color={textColors[variant]} style={{ fontWeight: '700' }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
