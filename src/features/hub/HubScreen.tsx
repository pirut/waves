// HubScreen.tsx — "My Hub": greeting, impact strip, tabs (Upcoming/Saved/Past),
// event cards. Ported from screens-hub.jsx `HubScreen`.

import { useQuery } from 'convex/react';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { Icon, type IconName } from '@/src/components/Icon';
import { Pill } from '@/src/components/Pill';
import { SkeletonList } from '@/src/components/Skeleton';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { cardShadow, UI, useResponsiveLayout } from '@/src/theme/layout';
import { HubEventCard } from './HubEventCard';
import { formatDateLabel } from '@/src/lib/date';

type HubScreenProps = {
  onOpenEvent: (id: string) => void;
};

type TabId = 'upcoming' | 'saved' | 'past';

export function HubScreen({ onOpenEvent }: HubScreenProps) {
  const { palette } = useTheme();
  const layout = useResponsiveLayout(760);
  const me = useQuery(api.users.me, {});
  const upcoming = useQuery(api.events.myUpcoming, {});
  const saved = useQuery(api.events.mySaved, {});
  const past = useQuery(api.events.myPast, {});
  const stats = useQuery(api.users.profileStats, {});

  const [tab, setTab] = useState<TabId>('upcoming');

  const upcomingCount = upcoming?.length ?? 0;
  const savedCount = saved?.length ?? 0;
  const greeting = greetingForHour(new Date().getHours());
  const upcomingLoading = upcoming === undefined;
  const savedLoading = saved === undefined;
  const pastLoading = past === undefined;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'upcoming', label: `Upcoming · ${upcomingCount}` },
    { id: 'saved', label: `Saved · ${savedCount}` },
    { id: 'past', label: 'Past' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: layout.sideInset, paddingTop: layout.isTablet ? 30 : 16, paddingBottom: 18 }}>
          <Text
            style={{
              fontFamily: FONTS.bodySemibold,
              fontSize: 12,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.ink3,
              marginBottom: 4,
            }}
          >
            My Hub
          </Text>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: layout.isTablet ? 44 : 36,
              lineHeight: layout.isTablet ? 46 : 38,
              color: palette.ink,
              letterSpacing: -0.6,
            }}
          >
            {greeting},
          </Text>
          <Text
            style={{
              fontFamily: FONTS.displayItalic,
              fontSize: layout.isTablet ? 44 : 36,
              lineHeight: layout.isTablet ? 46 : 38,
              color: palette.primary,
              letterSpacing: -0.6,
            }}
          >
            you have {upcomingCount} coming up.
          </Text>
        </View>

        {/* Impact strip */}
        {stats && (
          <View
            style={{
              marginLeft: layout.sideInset,
              marginRight: layout.sideInset,
              marginBottom: 20,
              padding: layout.isTablet ? 20 : 16,
              borderRadius: UI.radius.lg,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
              flexDirection: 'row',
              justifyContent: 'space-between',
              ...cardShadow(palette.dark),
            }}
          >
            <Stat value={stats.hours} label="hours" glyph="clock" />
            <Stat value={stats.streak} label="week streak" glyph="flame" accent />
            <Stat value={stats.badges} label="badges" glyph="ripple2" />
          </View>
        )}

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: layout.sideInset, marginBottom: 14 }}>
          {tabs.map((t) => (
            <Pill
              key={t.id}
              label={t.label}
              active={tab === t.id}
              variant="inverse"
              onPress={() => setTab(t.id)}
            />
          ))}
        </View>

        {/* List */}
        <View style={{ paddingHorizontal: layout.sideInset, gap: 14 }}>
          {tab === 'upcoming' && upcomingLoading && <SkeletonList count={3} />}
          {tab === 'upcoming' &&
            !upcomingLoading &&
            upcoming?.map((e: Doc<'events'>) => (
              <HubEventCard key={e._id} event={e} onPress={() => onOpenEvent(e._id)} />
            ))}
          {tab === 'saved' && savedLoading && <SkeletonList count={3} />}
          {tab === 'saved' &&
            !savedLoading &&
            saved?.map((e: Doc<'events'>) => (
              <HubEventCard key={e._id} event={e} saved onPress={() => onOpenEvent(e._id)} />
            ))}
          {tab === 'past' && pastLoading && <SkeletonList count={3} />}
          {tab === 'past' && !pastLoading && (
            <View>
              {(past ?? []).map((e: Doc<'events'>) => (
                <View
                  key={e._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: palette.line,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: palette.wash,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="check" size={14} color={palette.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontFamily: FONTS.bodyMedium, fontSize: 14, color: palette.ink }}
                      numberOfLines={1}
                    >
                      {e.title}
                    </Text>
                    <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3 }}>
                      {formatDateLabel(e.startsAt)} · {e.hours}h logged
                    </Text>
                  </View>
                  <Icon name="chevronR" size={14} color={palette.ink3} />
                </View>
              ))}
              {past?.length === 0 && (
                <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.ink3, paddingTop: 12 }}>
                  No past events yet. Sign up for one from the Map!
                </Text>
              )}
            </View>
          )}
          {(tab === 'upcoming' && !upcomingLoading && upcomingCount === 0) ||
          (tab === 'saved' && !savedLoading && savedCount === 0) ? (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: palette.ink3,
                padding: 18,
                borderWidth: 1,
                borderColor: palette.line,
                borderRadius: UI.radius.md,
                backgroundColor: palette.surface,
              }}
            >
              Nothing here yet.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function Stat({
  value,
  label,
  glyph,
  accent,
}: {
  value: number;
  label: string;
  glyph: IconName;
  accent?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Icon name={glyph} size={16} color={accent ? palette.accent : palette.primary} />
      <Text
        style={{
          fontFamily: FONTS.display,
          fontSize: 32,
          lineHeight: 32,
          color: palette.ink,
          marginTop: 6,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 11,
          color: palette.ink3,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
