import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { theme } from '@/src/core/theme/tokens';

type TextVariant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'overline';

type Props = PropsWithChildren<{
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>;

const variantStyles = StyleSheet.create({
  hero: {
    fontSize: theme.typography.hero,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  h1: {
    fontSize: theme.typography.h1,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: theme.typography.h2,
    fontWeight: '700',
    lineHeight: 28,
  },
  h3: {
    fontSize: theme.typography.h3,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: theme.typography.body,
    fontWeight: '500',
    lineHeight: 22,
  },
  caption: {
    fontSize: theme.typography.caption,
    fontWeight: '500',
    lineHeight: 18,
  },
  overline: {
    fontSize: theme.typography.overline,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
