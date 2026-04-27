// HubEventCard.tsx — horizontal card with a calendar "date block" on the
// left. Ported from screens-hub.jsx `HubEventCard`.

import { Pressable, Text, View } from 'react-native';
import type { Doc } from '@/convex/_generated/dataModel';
import { CategoryBadge } from '@/src/components/CategoryChip';
import { Icon } from '@/src/components/Icon';
import { formatDateBlock, formatTimeRange } from '@/src/lib/date';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { cardShadow, UI } from '@/src/theme/layout';

type HubEventCardProps = {
  event: Doc<'events'>;
  saved?: boolean;
  onPress?: () => void;
};

export function HubEventCard({ event, saved = false, onPress }: HubEventCardProps) {
  const { palette } = useTheme();
  const block = formatDateBlock(event.startsAt);
  const time = formatTimeRange(event.startsAt, event.endsAt).split(' – ')[0];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 14,
        minHeight: 112,
        padding: 14,
        borderRadius: UI.radius.lg,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
        ...cardShadow(palette.dark),
      }}
    >
      {/* Date block */}
      <View
        style={{
          width: 56,
          borderRadius: UI.radius.sm,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <View
          style={{
            paddingVertical: 3,
            backgroundColor: palette.primary,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: palette.dark ? '#000' : '#fff',
              fontFamily: FONTS.bodyBold,
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            {block.day}
          </Text>
        </View>
        <View style={{ paddingVertical: 6, backgroundColor: palette.surface2, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 22, lineHeight: 22, color: palette.ink }}>
            {block.num}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: palette.ink3,
              letterSpacing: 0.6,
              marginTop: 2,
            }}
          >
            {block.month}
          </Text>
        </View>
      </View>

      {/* Right side */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <CategoryBadge catId={event.category} size={18} />
          <Text
            style={{
              fontFamily: FONTS.bodySemibold,
              fontSize: 11,
              color: palette.ink3,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {time} · {event.location}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: 19,
            lineHeight: 22,
            color: palette.ink,
            marginBottom: 8,
            letterSpacing: -0.2,
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: palette.ink3 }}>
            {event.attendees} going
          </Text>
          {saved && <Icon name="heart" size={14} color={palette.accent} />}
        </View>
      </View>
    </Pressable>
  );
}
