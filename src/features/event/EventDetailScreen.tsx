// EventDetailScreen.tsx — hero gradient, title + host, meta grid, three tabs,
// sticky CTA. Ported from screens-detail.jsx `EventDetailScreen`.

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { CapacityBar } from '@/src/components/CapacityBar';
import { CategoryBadge } from '@/src/components/CategoryChip';
import { Icon } from '@/src/components/Icon';
import { MetaRow } from '@/src/components/MetaRow';
import { SectionTitle } from '@/src/components/SectionTitle';
import { oklch } from '@/src/theme/oklch';
import { CAT_TONE, CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { formatDateLabel, formatTimeRange } from '@/src/lib/date';
import { AboutTab } from './AboutTab';
import { UpdatesTab } from './UpdatesTab';
import { CommentsTab } from './CommentsTab';

type TabId = 'about' | 'updates' | 'comments';

type EventDetailScreenProps = {
  eventId: Id<'events'>;
  onBack: () => void;
  onOpenConfirm: () => void;
  onOpenCheckIn: () => void;
};

export function EventDetailScreen({
  eventId,
  onBack,
  onOpenConfirm,
  onOpenCheckIn,
}: EventDetailScreenProps) {
  const { palette } = useTheme();
  const detail = useQuery(api.events.detail, { id: eventId });
  const updates = useQuery(api.updates.listByEvent, { eventId });
  const toggleRsvp = useMutation(api.rsvps.toggleRsvp);
  const [tab, setTab] = useState<TabId>('about');
  const [submitting, setSubmitting] = useState(false);

  if (detail === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!detail || !detail.event) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={onBack} style={{ margin: 12 }}>
            <Icon name="chevronL" size={24} color={palette.ink} />
          </Pressable>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: palette.ink2,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            Event not found.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const { event, host, going, myRsvp } = detail;
  const signedUp = myRsvp?.status === 'going';
  // `event.category` comes through the api stub typed as any; narrow at the
  // boundary.
  const categoryId = event.category as CategoryId;
  const tone = CAT_TONE[categoryId];
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const pct = Math.round((event.attendees / event.capacity) * 100);

  const heroFromColor = oklch(palette.dark ? 0.4 : 0.7, 0.14, tone);
  const heroToColor = oklch(palette.dark ? 0.25 : 0.55, 0.12, (tone + 60) % 360);

  const onToggleRsvp = async () => {
    setSubmitting(true);
    try {
      const result = await toggleRsvp({ eventId });
      if (result.signedUp) {
        onOpenConfirm();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update RSVP';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* HERO */}
        <View style={{ height: 240, overflow: 'hidden', backgroundColor: heroFromColor }}>
          {/* Approximate gradient with a second half-height overlay color. RN
              StyleSheet doesn't support gradients natively; this keeps fidelity
              acceptable without adding expo-linear-gradient. */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: heroToColor,
              opacity: 0.55,
            }}
          />
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFillObject}
          >
            <Path
              d="M0 160 Q 100 120 200 160 T 400 160 L 400 240 L 0 240 Z"
              fill={palette.dark ? '#000' : '#fff'}
              opacity={0.15}
            />
            <Path
              d="M0 190 Q 100 160 200 190 T 400 190 L 400 240 L 0 240 Z"
              fill={palette.dark ? '#000' : '#fff'}
              opacity={0.2}
            />
          </Svg>

          <SafeAreaView edges={['top']} style={{ paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Pressable
                onPress={onBack}
                style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
              >
                <Icon name="chevronL" size={20} color="#000" />
              </Pressable>
              {category && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: 8,
                    paddingRight: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <Icon name={category.glyph} size={14} color={oklch(0.45, 0.14, tone)} />
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemibold,
                      fontSize: 12,
                      color: oklch(0.35, 0.14, tone),
                    }}
                  >
                    {category.label}
                  </Text>
                </View>
              )}
              <Pressable style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                <Icon name="share" size={16} color="#000" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Title block */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
            backgroundColor: palette.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -24,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              lineHeight: 32,
              color: palette.ink,
              letterSpacing: -0.4,
              marginBottom: 10,
            }}
          >
            {event.title}
          </Text>
          {host && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <CategoryBadge catId={categoryId} size={24} />
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.ink2, flex: 1 }}>
                Hosted by{' '}
                <Text style={{ fontFamily: FONTS.bodySemibold, color: palette.ink }}>
                  {host.name}
                </Text>
                {event.hostOrg ? ` · ${event.hostOrg}` : ''}
              </Text>
            </View>
          )}

          {/* Meta rows */}
          <View
            style={{
              padding: 14,
              backgroundColor: palette.surface2,
              borderRadius: 14,
              gap: 12,
            }}
          >
            <MetaRow
              icon="calendar"
              primary={formatDateLabel(event.startsAt)}
              secondary={formatTimeRange(event.startsAt, event.endsAt)}
            />
            <MetaRow icon="pin" primary={event.location} secondary={event.address} />
            <MetaRow
              icon="users"
              primary={`${event.attendees} going · ${Math.max(0, event.capacity - event.attendees)} spots left`}
              secondary={<CapacityBar pct={pct} maxWidth={160} />}
            />
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: 20,
            paddingTop: 16,
            backgroundColor: palette.surface,
            borderBottomWidth: 0.5,
            borderBottomColor: palette.line,
          }}
        >
          {([
            { id: 'about' as const, label: 'About' },
            {
              id: 'updates' as const,
              label: `Updates${(updates?.length ?? 0) ? ` · ${updates?.length}` : ''}`,
            },
            { id: 'comments' as const, label: 'Comments' },
          ]).map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? palette.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodySemibold,
                    fontSize: 13,
                    color: active ? palette.ink : palette.ink3,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        <View style={{ backgroundColor: palette.surface, paddingHorizontal: 20, paddingVertical: 16 }}>
          {tab === 'about' && (
            <AboutTab
              description={event.description}
              meetingPoint={event.meetingPoint}
              bring={event.bring}
              going={going}
            />
          )}
          {tab === 'updates' && <UpdatesTab updates={updates ?? []} />}
          {tab === 'comments' && <CommentsTab eventId={eventId} />}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 32,
          backgroundColor: palette.surface,
          borderTopWidth: 0.5,
          borderTopColor: palette.line,
        }}
      >
        {signedUp ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={onOpenCheckIn}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 26,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Icon name="check" size={18} color={palette.dark ? '#1a1a1a' : '#fff'} />
              <Text
                style={{
                  color: palette.dark ? '#1a1a1a' : '#fff',
                  fontFamily: FONTS.bodySemibold,
                  fontSize: 15,
                }}
              >
                You're going · Check in
              </Text>
            </Pressable>
            <Pressable
              onPress={onToggleRsvp}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="calendar" size={18} color={palette.ink} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onToggleRsvp}
            disabled={submitting}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: palette.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {submitting ? (
              <ActivityIndicator color={palette.dark ? '#1a1a1a' : '#fff'} />
            ) : (
              <Text
                style={{
                  color: palette.dark ? '#1a1a1a' : '#fff',
                  fontFamily: FONTS.bodySemibold,
                  fontSize: 15,
                }}
              >
                Sign up · {Math.max(0, event.capacity - event.attendees)} spots left
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
