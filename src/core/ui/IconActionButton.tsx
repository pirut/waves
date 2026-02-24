import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";

type IconTone = "neutral" | "primary" | "danger";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
  tone?: IconTone;
  loading?: boolean;
  disabled?: boolean;
};

const iconToneStyles: Record<
  IconTone,
  {
    shellBackground: string;
    shellBorder: string;
    icon: string;
    pressedBackground: string;
  }
> = {
  neutral: {
    shellBackground: theme.colors.surfaceGlassStrong,
    shellBorder: theme.colors.glassBorderStrong,
    icon: theme.colors.heading,
    pressedBackground: theme.colors.surfaceGlass,
  },
  primary: {
    shellBackground: theme.colors.sky,
    shellBorder: theme.colors.focusRing,
    icon: theme.colors.primary,
    pressedBackground: theme.mode === "dark" ? "rgba(58, 152, 255, 0.28)" : "rgba(10, 132, 255, 0.16)",
  },
  danger: {
    shellBackground: theme.mode === "dark" ? "rgba(255, 106, 97, 0.24)" : "rgba(255, 69, 58, 0.14)",
    shellBorder: theme.mode === "dark" ? "rgba(255, 163, 158, 0.36)" : "rgba(255, 69, 58, 0.3)",
    icon: theme.colors.coral,
    pressedBackground: theme.mode === "dark" ? "rgba(255, 106, 97, 0.3)" : "rgba(255, 69, 58, 0.2)",
  },
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: theme.control.minTouchSize,
  },
  shell: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  disabled: {
    opacity: 0.55,
  },
});

export function IconActionButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = "neutral",
  loading = false,
  disabled = false,
}: Props) {
  const toneStyle = iconToneStyles[tone];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !(disabled || loading) ? { backgroundColor: toneStyle.pressedBackground } : undefined,
        (disabled || loading) ? styles.disabled : undefined,
        pressed ? { transform: [{ scale: 0.98 }] } : undefined,
      ]}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: toneStyle.shellBackground,
            borderColor: toneStyle.shellBorder,
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={toneStyle.icon} size="small" />
        ) : (
          <Ionicons color={toneStyle.icon} name={icon} size={16} />
        )}
      </View>
    </Pressable>
  );
}
