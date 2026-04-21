// ProfileScreen.tsx — big avatar with streak badge, impact card, badges grid,
// settings rows. Ported from screens-hub.jsx `ProfileScreen`.

import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { Avatar } from '@/src/components/Avatar';
import { Icon, type IconName } from '@/src/components/Icon';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import type { PaletteHex } from '@/src/theme/oklch';

type BadgeEntry = {
  id: string;
  name: string;
  desc: string;
  glyph: string;
  earned: boolean;
};

export function ProfileScreen() {
  const { palette } = useTheme();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, {});
  const badges = useQuery(api.badges.listForMe, {});

  if (!me) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, alignItems: 'center' }}>
          <View>
            <Avatar user={{ initials: me.initials, tone: me.tone }} size={92} />
            {me.streak > 0 && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: palette.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: palette.bg,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontFamily: FONTS.bodyBold,
                    fontSize: 11,
                  }}
                >
                  {me.streak}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              color: palette.ink,
              marginTop: 14,
              letterSpacing: -0.3,
            }}
          >
            {me.name}
          </Text>
          {me.handle && (
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.ink3, marginTop: 2 }}>
              @{me.handle}
            </Text>
          )}
          {me.bio && (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: palette.ink2,
                marginTop: 12,
                maxWidth: 280,
                textAlign: 'center',
                lineHeight: 21,
              }}
            >
              {me.bio}
            </Text>
          )}
        </View>

        {/* Impact card */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: palette.surface,
            borderWidth: 0.5,
            borderColor: palette.line,
          }}
        >
          <View style={{ padding: 20 }}>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: palette.ink3,
                marginBottom: 4,
              }}
            >
              Your impact
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 56,
                  lineHeight: 56,
                  color: palette.ink,
                  letterSpacing: -1,
                }}
              >
                {me.hours}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.displayItalic,
                  fontSize: 22,
                  color: palette.ink2,
                }}
              >
                hours of good
              </Text>
            </View>
            <Svg
              width={120}
              height={60}
              viewBox="0 0 120 60"
              style={{ position: 'absolute', right: -10, top: 10, opacity: 0.3 }}
            >
              <Circle cx={60} cy={30} r={12} fill="none" stroke={palette.primary} strokeWidth={1.5} />
              <Circle cx={60} cy={30} r={22} fill="none" stroke={palette.primary} strokeWidth={1} />
              <Circle cx={60} cy={30} r={32} fill="none" stroke={palette.primary} strokeWidth={0.7} />
            </Svg>
          </View>
        </View>

        {/* Badges grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: 13,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                color: palette.ink,
              }}
            >
              Badges
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          {(badges ?? []).map((b: BadgeEntry) => (
            <View key={b.id} style={{ width: '33.33%', paddingHorizontal: 5, marginBottom: 10 }}>
              <BadgeCard badge={b} palette={palette} />
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={{ padding: 20, paddingTop: 12 }}>
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.ink3,
              marginBottom: 10,
            }}
          >
            Account
          </Text>
          <View
            style={{
              borderRadius: 14,
              backgroundColor: palette.surface,
              borderWidth: 0.5,
              borderColor: palette.line,
              overflow: 'hidden',
            }}
          >
            <SettingRow icon="settings" label="Preferences" />
            <SettingRow icon="bell" label="Notifications" />
            <SettingRow icon="gift" label="Invite friends" />
            <SettingRow icon="arrowR" label="Sign out" onPress={() => void signOut()} last />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeCard({
  badge,
  palette,
}: {
  badge: { id: string; name: string; desc: string; glyph: string; earned: boolean };
  palette: PaletteHex;
}) {
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 14,
        backgroundColor: badge.earned ? palette.surface : 'transparent',
        borderWidth: badge.earned ? 0.5 : 1,
        borderColor: palette.line,
        borderStyle: badge.earned ? 'solid' : 'dashed',
        alignItems: 'center',
        opacity: badge.earned ? 1 : 0.55,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: badge.earned ? palette.wash : palette.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <Icon
          name={badge.glyph as IconName}
          size={22}
          color={badge.earned ? palette.primary : palette.ink3}
        />
      </View>
      <Text
        style={{ fontFamily: FONTS.bodySemibold, fontSize: 12, color: palette.ink, textAlign: 'center' }}
        numberOfLines={1}
      >
        {badge.name}
      </Text>
      <Text
        style={{ fontFamily: FONTS.body, fontSize: 10, color: palette.ink3, marginTop: 2, textAlign: 'center' }}
        numberOfLines={2}
      >
        {badge.desc}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: palette.line,
      }}
    >
      <Icon name={icon} size={18} color={palette.ink2} />
      <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 14, color: palette.ink }}>
        {label}
      </Text>
      <Icon name="chevronR" size={14} color={palette.ink3} />
    </Pressable>
  );
}
