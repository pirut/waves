import { StyleSheet, View } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

type Props = {
  label: string;
  tone?: 'default' | 'success' | 'warning';
};

const toneStyles = {
  default: {
    backgroundColor: '#e6f6fb',
    color: theme.colors.primary,
  },
  success: {
    backgroundColor: '#eaf8f0',
    color: theme.colors.success,
  },
  warning: {
    backgroundColor: '#fff5dc',
    color: '#9c6b00',
  },
} as const;

export function Badge({ label, tone = 'default' }: Props) {
  const selectedTone = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: selectedTone.backgroundColor }]}>
      <AppText variant="caption" color={selectedTone.color} style={{ fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
});
