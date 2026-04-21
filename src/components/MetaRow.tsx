// MetaRow.tsx — icon + primary text + optional secondary text/element.
// Ported from waves/project/components/screens-detail.jsx `MetaRow`.

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';

type MetaRowProps = {
  icon: IconName;
  primary: ReactNode;
  secondary?: ReactNode;
};

export function MetaRow({ icon, primary, secondary }: MetaRowProps) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={16} color={palette.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        {typeof primary === 'string' ? (
          <Text
            style={{
              fontFamily: FONTS.bodyMedium,
              fontSize: 14,
              color: palette.ink,
              marginBottom: 2,
            }}
          >
            {primary}
          </Text>
        ) : (
          primary
        )}
        {secondary != null ? (
          typeof secondary === 'string' ? (
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3 }}>{secondary}</Text>
          ) : (
            secondary
          )
        ) : null}
      </View>
    </View>
  );
}
