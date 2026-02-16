import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style, innerStyle }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...theme.elevation.soft,
  },
  inner: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg + 2,
  },
});
