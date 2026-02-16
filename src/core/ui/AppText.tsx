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
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h1,
    fontWeight: "600",
    lineHeight: 40,
    letterSpacing: -0.35,
  },
  h2: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h2,
    fontWeight: "600",
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h3,
    fontWeight: "600",
    lineHeight: 27,
    letterSpacing: -0.06,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0.12,
  },
  caption: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.caption,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily: theme.fonts.mono,
    fontSize: theme.typography.overline,
    fontWeight: "600",
    lineHeight: 14,
    letterSpacing: 0.9,
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
