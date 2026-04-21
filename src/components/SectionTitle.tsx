// SectionTitle.tsx — all-caps, letter-spaced section header.
// Ported from waves/project/components/screens-detail.jsx `SectionTitle`.

import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';

export function SectionTitle({ children }: PropsWithChildren) {
  const { palette } = useTheme();
  return (
    <Text
      style={{
        fontFamily: FONTS.bodyBold,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: palette.ink3,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}
