// Wordmark.tsx — the italic serif "Make Waves" mark + wave glyph.
// Ported from waves/project/components/screens-map.jsx `Wordmark`.

import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONTS, useTheme } from '@/theme/ThemeProvider';

type WordmarkProps = {
  size?: number;
};

export function Wordmark({ size = 22 }: WordmarkProps) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Svg width={size * 0.9} height={size * 0.55} viewBox="0 0 24 14" fill="none">
        <Path
          d="M1 7 Q 5 1 9 7 T 17 7 T 23 7"
          stroke={palette.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Text
        style={{
          fontFamily: FONTS.displayItalic,
          fontSize: size,
          color: palette.ink,
          letterSpacing: -0.5,
        }}
      >
        Make Waves
      </Text>
    </View>
  );
}
