// Skeleton.tsx — shimmering placeholder block for loading states.
// Uses Animated for a subtle opacity pulse; no native deps required.

import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { UI } from '@/src/theme/layout';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) {
  const { palette } = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: radius,
          backgroundColor: palette.surface2,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Card-shaped skeleton used in Hub/Activity feeds. */
export function SkeletonCard() {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 14,
        padding: 14,
        borderRadius: UI.radius.lg,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      <Skeleton width={56} height={64} radius={UI.radius.sm} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <Skeleton width="40%" height={10} />
        <Skeleton width="80%" height={18} />
        <Skeleton width="30%" height={10} />
      </View>
    </View>
  );
}

/** A row of skeleton cards (count parameterizable). */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
