import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import type { EventListItem } from "@/src/modules/events/domain/types";
import { formatEventWindow } from "@/src/modules/events/utils/formatters";

type Props = {
  events: EventListItem[];
  onOpenEvent: (eventId: string) => void;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type MonthOption = {
  key: string;
  label: string;
  year: number;
  month: number;
};

function toMonthOption(value: Date): MonthOption {
  const year = value.getFullYear();
  const month = value.getMonth();
  const key = `${year}-${month}`;
  const label = value.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return { key, label, year, month };
}

export function EventCalendar({ events, onOpenEvent }: Props) {
  const monthOptions = useMemo(() => {
    const byKey = new Map<string, MonthOption>();

    for (const eventItem of events) {
      const option = toMonthOption(new Date(eventItem.startAt));
      byKey.set(option.key, option);
    }

    return Array.from(byKey.values()).sort((a, b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year,
    );
  }, [events]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(
    monthOptions[0]?.key ?? null,
  );

  useEffect(() => {
    if (!selectedMonthKey && monthOptions[0]) {
      setSelectedMonthKey(monthOptions[0].key);
    }
  }, [monthOptions, selectedMonthKey]);

  const selectedMonth =
    monthOptions.find((monthOption) => monthOption.key === selectedMonthKey) ??
    monthOptions[0] ??
    null;

  const monthEvents = useMemo(() => {
    if (!selectedMonth) {
      return [] as EventListItem[];
    }

    return events.filter((eventItem) => {
      const startDate = new Date(eventItem.startAt);
      return (
        startDate.getFullYear() === selectedMonth.year &&
        startDate.getMonth() === selectedMonth.month
      );
    });
  }, [events, selectedMonth]);

  const eventsByDay = useMemo(() => {
    const grouped: Record<number, EventListItem[]> = {};

    for (const eventItem of monthEvents) {
      const day = new Date(eventItem.startAt).getDate();
      grouped[day] = grouped[day] ? [...grouped[day], eventItem] : [eventItem];
    }

    return grouped;
  }, [monthEvents]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const firstEventDay = monthEvents[0] ? new Date(monthEvents[0].startAt).getDate() : null;
    setSelectedDay(firstEventDay);
  }, [selectedMonth?.key, monthEvents]);

  if (!selectedMonth) {
    return (
      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Calendar is empty
        </AppText>
        <AppText>Join events and they will appear here.</AppText>
      </Card>
    );
  }

  const currentMonthIndex = monthOptions.findIndex((option) => option.key === selectedMonth.key);
  const previousMonth = currentMonthIndex > 0 ? monthOptions[currentMonthIndex - 1] : null;
  const nextMonth =
    currentMonthIndex >= 0 && currentMonthIndex < monthOptions.length - 1
      ? monthOptions[currentMonthIndex + 1]
      : null;

  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const startWeekday = new Date(selectedMonth.year, selectedMonth.month, 1).getDay();

  const leadingCells = Array.from({ length: startWeekday }, (_, index) => `lead-${index}`);
  const dayCells = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] ?? [] : [];

  return (
    <Card>
      <View style={styles.headerRow}>
        <Button
          disabled={!previousMonth}
          fullWidth={false}
          label="Prev"
          onPress={() => previousMonth && setSelectedMonthKey(previousMonth.key)}
          variant="ghost"
        />
        <AppText variant="h3" color={theme.colors.heading}>
          {selectedMonth.label}
        </AppText>
        <Button
          disabled={!nextMonth}
          fullWidth={false}
          label="Next"
          onPress={() => nextMonth && setSelectedMonthKey(nextMonth.key)}
          variant="ghost"
        />
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((weekday) => (
          <AppText key={weekday} style={styles.weekdayLabel} variant="caption">
            {weekday}
          </AppText>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {leadingCells.map((key) => (
          <View key={key} style={styles.dayPlaceholder} />
        ))}

        {dayCells.map((day) => {
          const dayEvents = eventsByDay[day] ?? [];
          const isSelected = selectedDay === day;

          return (
            <Pressable
              key={`${selectedMonth.key}-${day}`}
              onPress={() => setSelectedDay(day)}
              style={[styles.dayCell, isSelected ? styles.dayCellSelected : undefined]}>
              <AppText
                color={isSelected ? theme.colors.primaryText : theme.colors.heading}
                variant="caption"
                style={{ fontWeight: "700" }}>
                {day}
              </AppText>
              {dayEvents.length > 0 ? (
                <View style={styles.eventDotRow}>
                  {dayEvents.slice(0, 3).map((eventItem) => (
                    <View
                      key={`${eventItem.id}-${day}`}
                      style={[
                        styles.eventDot,
                        { backgroundColor: isSelected ? "#dff7ff" : theme.colors.primary },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selectedDay ? (
        <View style={styles.selectedEventsSection}>
          <AppText variant="h3" color={theme.colors.heading}>
            {selectedMonth.label} {selectedDay}
          </AppText>
          {selectedDayEvents.length === 0 ? (
            <AppText>No events on this day.</AppText>
          ) : (
            selectedDayEvents.map((eventItem) => (
              <Pressable
                key={eventItem.id}
                onPress={() => onOpenEvent(eventItem.id)}
                style={styles.selectedEventCard}>
                <AppText color={theme.colors.heading} variant="caption" style={{ fontWeight: "700" }}>
                  {eventItem.title}
                </AppText>
                <AppText variant="caption">{formatEventWindow(eventItem.startAt, eventItem.endAt)}</AppText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayLabel: {
    textAlign: "center",
    width: `${100 / 7}%`,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayPlaceholder: {
    width: `${100 / 7 - 0.8}%`,
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: "#f5fbff",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    minHeight: 46,
    paddingTop: 6,
    width: `${100 / 7 - 0.8}%`,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eventDotRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  eventDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  selectedEventsSection: {
    gap: theme.spacing.xs,
  },
  selectedEventCard: {
    backgroundColor: "#f7fcff",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: 2,
    padding: theme.spacing.sm,
  },
});
