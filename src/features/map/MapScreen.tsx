// MapScreen.tsx — Map/Home. Full-bleed map, floating search+filter bar,
// horizontal category chips, streak ribbon, bottom peek card.

import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { Avatar } from '@/src/components/Avatar';
import { CategoryChip } from '@/src/components/CategoryChip';
import { EventMap } from '@/src/components/EventMap';
import { EventPeekCard, type PeekEvent } from '@/src/components/EventPeekCard';
import { Icon } from '@/src/components/Icon';
import { formatTimestamp } from '@/src/lib/date';
import { CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { FiltersSheet } from './FiltersSheet';

type MapScreenProps = {
  onOpenEvent: (eventId: string) => void;
};

export function MapScreen({ onOpenEvent }: MapScreenProps) {
  const { palette } = useTheme();
  const me = useQuery(api.users.me, {});

  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(new Set());
  const events = useQuery(api.events.discover, {
    cats: activeCats.size > 0 ? Array.from(activeCats) : undefined,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const effectiveSelected = selectedId ?? events?.[0]?._id ?? null;

  const markers = useMemo(
    () =>
      (events ?? []).map((e: Doc<'events'>) => ({
        id: e._id,
        lat: e.lat,
        lng: e.lng,
        category: e.category,
      })),
    [events],
  );

  const selectedEvent = useMemo<PeekEvent | null>(() => {
    if (!events || !effectiveSelected) return null;
    const e = events.find((x: Doc<'events'>) => x._id === effectiveSelected);
    if (!e) return null;
    return {
      id: e._id,
      title: e.title,
      category: e.category,
      timestamp: formatTimestamp(e.startsAt),
      location: e.location,
      attendees: e.attendees,
      capacity: e.capacity,
      going: [], // filled in by EventDetail; peek omits avatars for list perf
    };
  }, [events, effectiveSelected]);

  const toggleCat = (id: CategoryId) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <EventMap
        markers={markers}
        selectedId={effectiveSelected}
        onSelect={(id) => setSelectedId(id)}
      />

      <SafeAreaView style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 4 }}>
          <View style={[styles.searchBar, { backgroundColor: palette.surface }]}>
            <Icon name="search" size={18} color={palette.ink3} />
            <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 15, color: palette.ink3 }}>
              Search events near you
            </Text>
            {me && (
              <Avatar
                user={{ initials: me.initials, tone: me.tone }}
                size={28}
              />
            )}
          </View>
          <Pressable
            onPress={() => setFiltersVisible(true)}
            style={[styles.filterBtn, { backgroundColor: palette.surface }]}
          >
            <Icon name="filter" size={18} color={palette.ink} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 12 }}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.id}
              cat={c}
              active={activeCats.has(c.id)}
              onPress={() => toggleCat(c.id)}
            />
          ))}
        </ScrollView>

        {me && me.streak > 0 && (
          <View
            style={[
              styles.streak,
              { backgroundColor: palette.surface, alignSelf: 'flex-end', marginRight: 12 },
            ]}
          >
            <Icon name="flame" size={14} color={palette.accent} />
            <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 12, color: palette.ink }}>
              {me.streak}-week streak
            </Text>
          </View>
        )}
      </SafeAreaView>

      {selectedEvent && (
        <EventPeekCard event={selectedEvent} onOpen={() => onOpenEvent(selectedEvent.id)} />
      )}

      <FiltersSheet
        visible={filtersVisible}
        initialCats={activeCats}
        onApply={setActiveCats}
        onClose={() => setFiltersVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
