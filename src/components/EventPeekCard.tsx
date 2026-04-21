// EventPeekCard.tsx — bottom-sheet-style card that appears on the Map above
// the tab bar when a pin is selected.
// Ported from waves/project/components/screens-map.jsx `EventPeekCard`.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { Avatar } from './Avatar';
import { CapacityBarHero } from './CapacityBar';
import { CategoryBadge } from './CategoryChip';
import type { CategoryId } from '@/theme/tokens';

export type PeekEvent = {
  id: string;
  title: string;
  category: CategoryId;
  timestamp: string; // "in 3 days"
  location: string;
  attendees: number;
  capacity: number;
  going: Array<{ id: string; initials: string; tone: number }>;
};

type EventPeekCardProps = {
  event: PeekEvent;
  onOpen?: () => void;
};

export function EventPeekCard({ event, onOpen }: EventPeekCardProps) {
  const { palette } = useTheme();
  const pct = Math.round((event.attendees / event.capacity) * 100);
  return (
    <Pressable
      onPress={onOpen}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.row}>
        <CategoryBadge catId={event.category} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: FONTS.bodySemibold,
              fontSize: 11,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: palette.ink3,
              marginBottom: 2,
            }}
          >
            {event.timestamp} · {event.location}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 22,
              lineHeight: 25,
              color: palette.ink,
              marginBottom: 6,
              letterSpacing: -0.2,
            }}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row' }}>
              {event.going.slice(0, 4).map((u, i) => (
                <View key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <Avatar user={u} size={22} border={2} />
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink2 }}>
              {event.attendees} going · {Math.max(0, event.capacity - event.attendees)} spots left
            </Text>
          </View>
          <CapacityBarHero pct={pct} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 96,
    left: 12,
    right: 12,
    borderRadius: 22,
    padding: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
});
