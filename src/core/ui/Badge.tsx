import { StyleSheet, View } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

type Props = {
  label: string;
  tone?: 'default' | 'success' | 'warning';
};

const toneStyles = {
  default: {
    backgroundColor: "#EEF0F5",
    color: theme.colors.body,
    borderColor: "#E5E5EA",
  },
  success: {
    backgroundColor: "#EAF9EF",
    color: "#1D7A3A",
    borderColor: "#D4F0DE",
  },
  warning: {
    backgroundColor: "#FFF4E5",
    color: "#8A5300",
    borderColor: "#FFE5C2",
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
    minHeight: theme.control.minTouchSize - 8,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  label: {
    fontFamily: theme.fonts.body,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
