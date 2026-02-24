import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/core/theme/tokens";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style, innerStyle }: Props) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={[
          theme.colors.surfaceGlassStrong,
          theme.colors.surfaceGlass,
        ]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.xl + 2,
    borderWidth: 1,
    overflow: "hidden",
    ...theme.elevation.soft,
  },
  inner: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
});
