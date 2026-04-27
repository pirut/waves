// EventDetailScreen.tsx — hero gradient, title + host, meta grid, three tabs,
// sticky CTA. Ported from screens-detail.jsx `EventDetailScreen`.

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, IconButton } from '@/src/components/Button';
import { CapacityBar } from '@/src/components/CapacityBar';
import { CategoryBadge } from '@/src/components/CategoryChip';
import { Icon } from '@/src/components/Icon';
import { MetaRow } from '@/src/components/MetaRow';
import { SectionTitle } from '@/src/components/SectionTitle';
import { oklch } from '@/src/theme/oklch';
import { CAT_TONE, CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { cardShadow, UI, useResponsiveLayout } from '@/src/theme/layout';
import { formatDateLabel, formatTimeRange } from '@/src/lib/date';
import { mapsUrl } from '@/src/lib/places';
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
  const layout = useResponsiveLayout(UI.detailMax);
  const detail = useQuery(api.events.detail, { id: eventId });
  const updates = useQuery(api.updates.listByEvent, { eventId });
  const toggleRsvp = useMutation(api.rsvps.toggleRsvp);
  const toggleSave = useMutation(api.savedEvents.toggleSave);
  const [tab, setTab] = useState<TabId>('about');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const saved = Boolean(detail.mySaved);
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

  const onToggleSave = async () => {
    setSaving(true);
    try {
      await toggleSave({ eventId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update saved event';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    try {
      const url = mapsUrl({ lat: event.lat, lng: event.lng, label: event.title });
      await Share.share({
        title: event.title,
        message: `${event.title} at ${event.location}\n${formatDateLabel(event.startsAt)} ${formatTimeRange(event.startsAt, event.endsAt)}\n${url}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not share this event';
      Alert.alert('Share failed', message);
    }
  };

  const onOpenMap = async () => {
    const url = mapsUrl({ lat: event.lat, lng: event.lng, label: event.title });
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {/* HERO */}
        <View
          style={{
            height: layout.isTablet ? 300 : 240,
            overflow: 'hidden',
            marginHorizontal: layout.isTablet ? layout.sideInset : 0,
            marginTop: layout.isTablet ? 18 : 0,
            borderRadius: layout.isTablet ? UI.radius.xl : 0,
          }}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={heroFromColor} stopOpacity="1" />
                <Stop offset="1" stopColor={heroToColor} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="400" height="240" fill="url(#heroGrad)" />
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

          <SafeAreaView edges={['top']} style={{ paddingHorizontal: layout.isTablet ? 18 : 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share event"
                onPress={onShare}
                style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
              >
                <Icon name="share" size={16} color="#000" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Title block */}
        <View
          style={{
            marginHorizontal: layout.isTablet ? layout.sideInset : 0,
            paddingHorizontal: layout.isTablet ? 28 : 20,
            paddingTop: 22,
            paddingBottom: 12,
            backgroundColor: palette.surface,
            borderTopLeftRadius: UI.radius.xl,
            borderTopRightRadius: UI.radius.xl,
            borderBottomLeftRadius: layout.isTablet ? UI.radius.xl : 0,
            borderBottomRightRadius: layout.isTablet ? UI.radius.xl : 0,
            marginTop: -24,
            borderWidth: layout.isTablet ? 1 : 0,
            borderColor: palette.line,
            ...cardShadow(palette.dark),
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: layout.isTablet ? 34 : 28,
              lineHeight: layout.isTablet ? 38 : 32,
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
              borderRadius: UI.radius.md,
              gap: 12,
            }}
          >
            <MetaRow
              icon="calendar"
              primary={formatDateLabel(event.startsAt)}
              secondary={formatTimeRange(event.startsAt, event.endsAt)}
            />
            <MetaRow
              icon="pin"
              primary={event.location}
              secondary={(
                <Pressable onPress={onOpenMap} style={{ alignSelf: 'flex-start' }}>
                  <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 12, color: palette.primary }}>
                    {event.address} - View on map
                  </Text>
                </Pressable>
              )}
            />
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
            marginHorizontal: layout.isTablet ? layout.sideInset : 0,
            paddingHorizontal: layout.isTablet ? 28 : 20,
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
        <View
          style={{
            marginHorizontal: layout.isTablet ? layout.sideInset : 0,
            backgroundColor: palette.surface,
            paddingHorizontal: layout.isTablet ? 28 : 20,
            paddingVertical: 18,
            borderBottomLeftRadius: layout.isTablet ? UI.radius.xl : 0,
            borderBottomRightRadius: layout.isTablet ? UI.radius.xl : 0,
            borderWidth: layout.isTablet ? 1 : 0,
            borderTopWidth: 0,
            borderColor: palette.line,
          }}
        >
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
          paddingLeft: layout.isTablet ? layout.sideInset : 16,
          paddingRight: layout.isTablet ? layout.sideInset : 16,
          paddingTop: 12,
          paddingBottom: 32,
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.line,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {signedUp ? (
            <View style={{ flex: 1 }}>
              <Button
                label="You're going · Check in"
                icon="check"
                onPress={onOpenCheckIn}
              />
            </View>
          ) : event.attendees >= event.capacity ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Event full · Join waitlist"
                variant="secondary"
                loading={submitting}
                onPress={onToggleRsvp}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Button
                label={`Sign up · ${Math.max(0, event.capacity - event.attendees)} spots left`}
                loading={submitting}
                onPress={onToggleRsvp}
              />
            </View>
          )}
          <IconButton
            icon="heart"
            active={saved}
            disabled={saving}
            onPress={onToggleSave}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save event'}
          />
        </View>
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
