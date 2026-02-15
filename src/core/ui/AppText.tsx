import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";

type TextVariant = "hero" | "h1" | "h2" | "h3" | "body" | "caption" | "overline";

type Props = PropsWithChildren<{
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>;

const variantStyles = StyleSheet.create({
  hero: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.hero,
    fontWeight: "600",
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h1,
    fontWeight: "600",
    lineHeight: 36,
    letterSpacing: -0.45,
  },
  h2: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h2,
    fontWeight: "600",
    lineHeight: 31,
    letterSpacing: -0.25,
  },
  h3: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h3,
    fontWeight: "600",
    lineHeight: 25,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: 0.05,
  },
  caption: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.caption,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: 0.05,
  },
  overline: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.overline,
    fontWeight: "600",
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
});

export function AppText({
  children,
  variant = 'body',
  color = theme.colors.body,
  style,
  numberOfLines,
}: Props) {
  return (
    <Text numberOfLines={numberOfLines} style={[variantStyles[variant], { color }, style]}>
      {children}
    </Text>
  );
}
