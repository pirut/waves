// EmptyState.tsx — centered icon puck + copy.
// Ported from waves/project/components/screens-detail.jsx `EmptyState`.

import { Text, View } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';

type EmptyStateProps = {
  icon: IconName;
  text: string;
};

export function EmptyState({ icon, text }: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: palette.wash,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Icon name={icon} size={24} color={palette.primary} />
      </View>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 13,
          color: palette.ink3,
          maxWidth: 240,
          lineHeight: 19.5,
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
