// app/event/[id].tsx — event detail route, presented as a card on top of tabs.
// Hosts the modal sheets (Confirm / CheckIn) for the event.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { View } from 'react-native';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { EventDetailScreen } from '@/src/features/event/EventDetailScreen';
import { ConfirmSheet } from '@/src/features/event/ConfirmSheet';
import { CheckInSheet } from '@/src/features/event/CheckInSheet';
import { formatDateLabel } from '@/src/lib/date';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const eventId = id as Id<'events'>;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [checkInVisible, setCheckInVisible] = useState(false);

  const detail = useQuery(api.events.detail, eventId ? { id: eventId } : 'skip');

  if (!eventId) {
    return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  return (
    <>
      <EventDetailScreen
        eventId={eventId}
        onBack={() => router.back()}
        onOpenConfirm={() => setConfirmVisible(true)}
        onOpenCheckIn={() => setCheckInVisible(true)}
      />
      <ConfirmSheet
        visible={confirmVisible}
        title={detail?.event?.title ?? ''}
        dateLabel={detail?.event ? formatDateLabel(detail.event.startsAt) : ''}
        onClose={() => setConfirmVisible(false)}
      />
      <CheckInSheet
        visible={checkInVisible}
        eventId={eventId}
        onClose={() => setCheckInVisible(false)}
      />
    </>
  );
}
