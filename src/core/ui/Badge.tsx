import { StyleSheet, View } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

type Props = {
  label: string;
  tone?: 'default' | 'success' | 'warning';
};

const toneStyles = {
  default: {
    backgroundColor: 'rgba(30,119,169,0.14)',
    color: theme.colors.primary,
    borderColor: 'rgba(30,119,169,0.34)',
  },
  success: {
    backgroundColor: 'rgba(43,147,72,0.16)',
    color: theme.colors.success,
    borderColor: 'rgba(43,147,72,0.4)',
  },
  warning: {
    backgroundColor: 'rgba(255,209,102,0.25)',
    color: '#9c6b00',
    borderColor: 'rgba(255,209,102,0.5)',
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
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
  },
  label: {
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
