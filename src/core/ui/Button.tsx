import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "destructiveMuted";

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
    borderRadius: theme.radius.lg + 2,
    minHeight: theme.control.minTouchSize,
    overflow: "hidden",
    borderWidth: 1,
  },
  fill: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize + 4,
    paddingHorizontal: theme.spacing.xl,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.elevation.soft,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceGlassStrong,
    borderColor: theme.colors.glassBorderStrong,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.mode === "dark" ? "rgba(255, 106, 97, 0.28)" : "rgba(255, 69, 58, 0.16)",
    borderColor: theme.mode === "dark" ? "rgba(255, 163, 158, 0.4)" : "rgba(255, 69, 58, 0.38)",
  },
  destructiveMuted: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.56,
  },
  pressedPrimary: {
    opacity: 0.92,
  },
  pressedSecondary: {
    backgroundColor: theme.colors.surfaceGlass,
  },
  pressedGhost: {
    backgroundColor: theme.colors.sky,
    borderColor: theme.colors.focusRing,
  },
  pressedDanger: {
    opacity: 0.9,
  },
  pressedDestructiveMuted: {
    backgroundColor: theme.mode === "dark" ? "rgba(255, 105, 97, 0.24)" : "rgba(255, 69, 58, 0.14)",
  },
});

const textColors: Record<ButtonVariant, string> = {
  primary: theme.colors.primaryText,
  secondary: theme.colors.heading,
  ghost: theme.colors.primary,
  danger: theme.mode === "dark" ? "#FFE4E1" : "#9F1D17",
  destructiveMuted: theme.colors.coral,
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
  const pressedVariantStyle =
    variant === "primary"
      ? styles.pressedPrimary
      : variant === "secondary"
        ? styles.pressedSecondary
        : variant === "ghost"
          ? styles.pressedGhost
          : variant === "danger"
            ? styles.pressedDanger
            : styles.pressedDestructiveMuted;

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
        pressed ? pressedVariantStyle : undefined,
        pressed ? { transform: [{ scale: 0.985 }] } : undefined,
        (disabled || loading) && styles.disabled,
      ]}>
      <View style={styles.fill}>
        {loading ? (
          <ActivityIndicator color={textColors[variant]} />
        ) : (
          <AppText color={textColors[variant]} style={{ fontWeight: "700", letterSpacing: -0.2 }}>
            {label}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
