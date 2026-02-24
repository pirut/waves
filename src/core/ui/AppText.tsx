import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";

type TextVariant = "hero" | "h1" | "h2" | "h3" | "body" | "caption" | "overline";

type Props = PropsWithChildren<{
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
}>;

const variantStyles = StyleSheet.create({
  hero: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.hero,
    fontWeight: "700",
    lineHeight: 46,
    letterSpacing: -0.45,
  },
  h1: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h1,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h2,
    fontWeight: "600",
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: theme.fonts.display,
    fontSize: theme.typography.h3,
    fontWeight: "600",
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    fontWeight: "400",
    lineHeight: 25,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.caption,
    fontWeight: "400",
    lineHeight: 19,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.overline,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: 0.15,
  },
});

export function AppText({
  children,
  variant = 'body',
  color = theme.colors.body,
  style,
  numberOfLines,
  allowFontScaling = true,
  maxFontSizeMultiplier = 2,
}: Props) {
  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      style={[variantStyles[variant], { color }, style]}>
      {children}
    </Text>
  );
}
