// Wordmark.tsx — Make Waves logo assets, sourced from the 2026 logo kit.

import { Image, Text, View } from 'react-native';
import { FONTS } from '@/theme/ThemeProvider';

type WordmarkProps = {
  size?: number;
  stacked?: boolean;
  tagline?: boolean;
};

const BRAND = {
  teal: '#0F6663',
  teal2: '#2FA39A',
};

const logoMark = require('../../assets/brand/logo-mark.png');
const logoLockup = require('../../assets/brand/logo-lockup.png');

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Image
      source={logoMark}
      resizeMode="contain"
      style={{ width: size, height: size }}
      accessibilityIgnoresInvertColors
    />
  );
}

export function Wordmark({ size = 22, stacked = false, tagline = false }: WordmarkProps) {
  if (stacked && tagline) {
    const width = size * 7.8;
    return (
      <Image
        source={logoLockup}
        resizeMode="contain"
        style={{ width, height: width * 0.66 }}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const markSize = stacked ? size * 1.75 : size * 1.1;
  return (
    <View
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? 8 : 7,
      }}
    >
      <LogoMark size={markSize} />
      <View style={{ alignItems: stacked ? 'center' : 'flex-start' }}>
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: size,
            lineHeight: size * 1.03,
            color: BRAND.teal,
            letterSpacing: -0.4,
          }}
        >
          Make Waves
        </Text>
        {tagline && (
          <Text
            style={{
              marginTop: stacked ? 6 : 2,
              fontFamily: FONTS.bodyBold,
              fontSize: Math.max(9, size * 0.25),
              letterSpacing: 3,
              color: BRAND.teal2,
              textTransform: 'uppercase',
            }}
          >
            Community - Events - Impact
          </Text>
        )}
      </View>
    </View>
  );
}
