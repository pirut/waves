import { StyleSheet, View } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

type Props = {
  label: string;
  tone?: 'default' | 'success' | 'warning';
};

const toneStyles = {
  default: {
    backgroundColor: "rgba(255, 253, 250, 0.92)",
    color: theme.colors.primaryDeep,
    borderColor: "rgba(31, 74, 91, 0.48)",
  },
  success: {
    backgroundColor: "rgba(240, 249, 244, 0.95)",
    color: "#285543",
    borderColor: "rgba(63, 120, 97, 0.52)",
  },
  warning: {
    backgroundColor: "rgba(250, 241, 227, 0.95)",
    color: "#7a5126",
    borderColor: "rgba(184, 134, 70, 0.55)",
  },
} as const;

export function Badge({ label, tone = 'default' }: Props) {
  const selectedTone = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: selectedTone.backgroundColor,
          borderColor: selectedTone.borderColor,
        },
      ]}>
      <AppText variant="caption" color={selectedTone.color} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  label: {
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
});
