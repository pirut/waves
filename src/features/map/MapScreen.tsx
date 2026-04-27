// MapScreen.tsx — Map/Home. Full-bleed map, floating search+filter bar,
// horizontal category chips, streak ribbon, bottom peek card.

import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { Wordmark } from '@/src/components/Wordmark';
import { formatTimestamp } from '@/src/lib/date';
import { CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { cardShadow, UI, useResponsiveLayout } from '@/src/theme/layout';
import { DEFAULT_MAP_FILTERS, FiltersSheet, type MapFilterState } from './FiltersSheet';

type MapScreenProps = {
  onOpenEvent: (eventId: string) => void;
};

export function MapScreen({ onOpenEvent }: MapScreenProps) {
  const { palette } = useTheme();
  const layout = useResponsiveLayout(760);
  const me = useQuery(api.users.me, {});

  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(new Set());
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);
  const rawEvents = useQuery(api.events.discover, {
    cats: activeCats.size > 0 ? Array.from(activeCats) : undefined,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const events = useMemo(() => {
    const all = rawEvents ?? [];
    const needle = query.trim().toLowerCase();
    const now = Date.now();
    return all.filter((event: Doc<'events'>) => {
      if (needle) {
        const haystack = `${event.title} ${event.location} ${event.address} ${event.description}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      const daysAway = Math.ceil((event.startsAt - now) / (24 * 60 * 60 * 1000));
      if (filters.when === 0 && daysAway > 0) return false;
      if (filters.when === 1 && daysAway > 7) return false;
      if (filters.when === 2) {
        const day = new Date(event.startsAt).getDay();
        if (![0, 6].includes(day) || daysAway > 14) return false;
      }
      if (filters.commitment === 1 && event.hours >= 2) return false;
      if (filters.commitment === 2 && (event.hours < 2 || event.hours > 3)) return false;
      if (filters.commitment === 3 && event.hours < 3) return false;
      if (filters.tags.length > 0 && !filters.tags.every((tag) => matchesVibe(tag, event))) return false;
      return true;
    });
  }, [rawEvents, query, filters]);

  const effectiveSelected = selectedId && events.some((e) => e._id === selectedId)
    ? selectedId
    : events[0]?._id ?? null;

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
    setSelectedId(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <EventMap
        markers={markers}
        selectedId={effectiveSelected}
        onSelect={(id) => setSelectedId(id)}
      />

      <SafeAreaView style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: layout.sideInset,
            marginTop: layout.isTablet ? 12 : 4,
            alignItems: 'center',
          }}
        >
          {layout.isTablet && (
            <View style={[styles.brandPill, { backgroundColor: palette.surface, borderColor: palette.line }, cardShadow(palette.dark)]}>
              <Wordmark size={20} />
            </View>
          )}
          <View style={[styles.searchBar, { backgroundColor: palette.surface }]}>
            <Icon name="search" size={18} color={palette.ink3} />
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedId(null);
              }}
              placeholder="Search Lake Trail, CityPlace, food..."
              placeholderTextColor={palette.ink3}
              returnKeyType="search"
              style={{
                flex: 1,
                fontFamily: FONTS.body,
                fontSize: 15,
                color: palette.ink,
                paddingVertical: 0,
              }}
            />
            {me && (
              <Avatar
                user={{ initials: me.initials, tone: me.tone }}
                size={28}
              />
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            hitSlop={8}
            onPress={() => setFiltersVisible(true)}
            style={[styles.filterBtn, { backgroundColor: palette.surface }]}
          >
            <Icon name="filter" size={18} color={palette.ink} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.sideInset, gap: 8, paddingVertical: 12 }}
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
              {
                backgroundColor: palette.surface,
                alignSelf: 'flex-end',
                marginRight: layout.sideInset,
                borderColor: palette.line,
              },
            ]}
          >
            <Icon name="flame" size={14} color={palette.accent} />
            <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 12, color: palette.ink }}>
              {me.streak}-week streak
            </Text>
          </View>
        )}
        {rawEvents && events.length === 0 && (
          <View
            style={[
              styles.noResults,
              {
                marginHorizontal: layout.sideInset,
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
              cardShadow(palette.dark),
            ]}
          >
            <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 13, color: palette.ink }}>
              No matching waves nearby
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3, marginTop: 3 }}>
              Try clearing a filter or searching another WPB neighborhood.
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
        initialFilters={filters}
        onApply={(cats, nextFilters) => {
          setActiveCats(cats);
          setFilters(nextFilters);
          setSelectedId(null);
        }}
        onClose={() => setFiltersVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  brandPill: {
    height: 48,
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    marginTop: 8,
    padding: 14,
  },
});

function matchesVibe(tag: string, event: Doc<'events'>) {
  const text = `${event.title} ${event.location} ${event.address} ${event.description}`.toLowerCase();
  if (tag === 'Waterfront') return /lake|trail|beach|water|lagoon|island|palm beach/.test(text);
  if (tag === 'Family-friendly') return /family|kids|reading|park|beginner/.test(text);
  if (tag === 'Indoor') return /library|supper|dinner|morselife|blood/.test(text);
  if (tag === 'Hands-on') return /cleanup|plant|walk|repair|prep|serve|fix/.test(text);
  return true;
}
