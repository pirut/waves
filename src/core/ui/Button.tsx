import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

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
    borderRadius: theme.radius.md,
    minHeight: theme.control.minTouchSize,
    overflow: "hidden",
    borderWidth: 1,
  },
  fill: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  danger: {
    backgroundColor: theme.colors.coral,
    borderColor: theme.colors.coral,
  },
  disabled: {
    opacity: 0.5,
  },
});

const textColors: Record<ButtonVariant, string> = {
  primary: theme.colors.primaryText,
  secondary: theme.colors.heading,
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
      android_ripple={{ color: "rgba(0, 122, 255, 0.12)" }}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        fullWidth ? { alignSelf: "stretch" } : undefined,
        pressed ? { opacity: 0.72 } : undefined,
        (disabled || loading) && styles.disabled,
      ]}>
      <View style={styles.fill}>
        {loading ? (
          <ActivityIndicator color={textColors[variant]} />
        ) : (
          <AppText color={textColors[variant]} style={{ fontWeight: "600", letterSpacing: 0 }}>
            {label}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
