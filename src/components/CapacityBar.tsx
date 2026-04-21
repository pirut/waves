// CapacityBar.tsx — thin progress bar for event capacity.
// Ported from waves/project/components/screens-detail.jsx `CapacityBar`.

import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type CapacityBarProps = {
  /** 0–100 */
  pct: number;
  /** Thickness in px. Default 4. */
  height?: number;
  /** Max width in px; leave undefined for flex. */
  maxWidth?: number;
};

export function CapacityBar({ pct, height = 4, maxWidth }: CapacityBarProps) {
  const { palette } = useTheme();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: palette.wash,
        overflow: 'hidden',
        marginTop: 6,
        maxWidth,
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped}%`,
          backgroundColor: palette.primary,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

/** Wider version with a brand gradient, used on the Map peek card. */
export function CapacityBarHero({ pct }: { pct: number }) {
  const { palette } = useTheme();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.wash,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped}%`,
          backgroundColor: palette.primary2, // approximate gradient with primary2 tone
          borderRadius: 3,
        }}
      />
    </View>
  );
}
