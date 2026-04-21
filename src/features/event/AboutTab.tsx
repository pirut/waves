// AboutTab.tsx — description + meeting point + what to bring + who's going.

import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Icon } from '@/src/components/Icon';
import { SectionTitle } from '@/src/components/SectionTitle';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type GoingUser = {
  _id: string;
  name: string;
  initials: string;
  tone: number;
};

type AboutTabProps = {
  description: string;
  meetingPoint?: string;
  bring: string[];
  going: GoingUser[];
};

export function AboutTab({ description, meetingPoint, bring, going }: AboutTabProps) {
  const { palette } = useTheme();
  return (
    <View>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 15,
          lineHeight: 23,
          color: palette.ink,
          marginBottom: 20,
        }}
      >
        {description}
      </Text>

      {meetingPoint && (
        <>
          <SectionTitle>Where to meet</SectionTitle>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: palette.ink2,
              lineHeight: 21,
              marginBottom: 20,
            }}
          >
            {meetingPoint}
          </Text>
        </>
      )}

      {bring.length > 0 && (
        <>
          <SectionTitle>What to bring</SectionTitle>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {bring.map((item, i) => (
              <View key={`${i}-${item}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="check" size={16} color={palette.success} />
                <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink2, flex: 1 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {going.length > 0 && (
        <>
          <SectionTitle>Who's going ({going.length})</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            {going.map((u) => (
              <View
                key={u._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 6,
                  paddingRight: 10,
                  paddingLeft: 6,
                  borderRadius: 20,
                  backgroundColor: palette.surface2,
                }}
              >
                <Avatar user={{ initials: u.initials, tone: u.tone }} size={24} />
                <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 12, color: palette.ink }}>
                  {u.name}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
