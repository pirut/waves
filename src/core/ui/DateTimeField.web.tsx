import { FontAwesome } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo, useState, type CSSProperties } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DayPicker } from "react-day-picker";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type Props = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  minimumDate?: number;
  maximumDate?: number;
  minuteInterval?: 1 | 5 | 10 | 15 | 20 | 30;
};

function clampTimestamp(
  value: number,
  minimumDate?: number,
  maximumDate?: number,
) {
  if (minimumDate !== undefined && value < minimumDate) {
    return minimumDate;
  }
  if (maximumDate !== undefined && value > maximumDate) {
    return maximumDate;
  }
  return value;
}

function buildTimeOptions(stepMinutes: number) {
  const options: Array<{ value: string; label: string }> = [];
  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += stepMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    options.push({
      value: `${hours}:${minutes}`,
      label: format(date, "h:mm a"),
    });
  }
  return options;
}

function parseTimeValue(value: string) {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return { hours, minutes };
}

export function DateTimeField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  minuteInterval = 5,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => new Date(value), [value]);
  const timeOptions = useMemo(
    () => buildTimeOptions(minuteInterval),
    [minuteInterval],
  );

  const onSelectDate = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setFullYear(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate(),
    );

    const nextTimestamp = clampTimestamp(
      mergedDate.getTime(),
      minimumDate,
      maximumDate,
    );
    onChange(nextTimestamp);
  };

  const onSelectTime = (nextTimeValue: string) => {
    const parsed = parseTimeValue(nextTimeValue);
    if (!parsed) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setHours(parsed.hours, parsed.minutes, 0, 0);

    const nextTimestamp = clampTimestamp(
      mergedDate.getTime(),
      minimumDate,
      maximumDate,
    );
    onChange(nextTimestamp);
  };

  const selectedTimeValue = `${selectedDate.getHours()}:${selectedDate.getMinutes()}`;

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>

      <View style={styles.shell}>
        <Pressable
          onPress={() => setIsOpen((current) => !current)}
          style={({ pressed }) => [
            styles.trigger,
            pressed ? styles.triggerPressed : undefined,
            isOpen ? styles.triggerOpen : undefined,
          ]}>
          <View style={styles.triggerContent}>
            <FontAwesome color={theme.colors.muted} name="calendar-o" size={16} />
            <AppText color={theme.colors.heading} style={styles.triggerText}>
              {format(selectedDate, "PPP • h:mm a")}
            </AppText>
          </View>
          <FontAwesome
            color={theme.colors.subtle}
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={12}
          />
        </Pressable>

        {isOpen ? (
          <View style={styles.popover}>
            <DayPicker
              fromDate={minimumDate ? new Date(minimumDate) : undefined}
              mode="single"
              onSelect={onSelectDate}
              selected={selectedDate}
              showOutsideDays
              toDate={maximumDate ? new Date(maximumDate) : undefined}
              weekStartsOn={0}
              styles={dayPickerStyles}
            />

            <View style={styles.timeSection}>
              <AppText variant="caption" color={theme.colors.muted}>
                Time
              </AppText>
              <select
                onChange={(event) => onSelectTime(event.target.value)}
                style={styles.timeSelect as CSSProperties}
                value={selectedTimeValue}>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const dayPickerStyles: Record<string, CSSProperties> = {
  root: {
    margin: 0,
  },
  month: {
    margin: 0,
  },
  caption: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  caption_label: {
    color: theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  nav: {
    display: "flex",
    gap: 6,
  },
  nav_button: {
    alignItems: "center",
    background: theme.colors.elevatedMuted,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.heading,
    cursor: "pointer",
    display: "flex",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  table: {
    borderCollapse: "separate",
    borderSpacing: "2px",
    width: "100%",
  },
  head_row: {},
  head_cell: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    fontWeight: 600,
    height: 26,
    textAlign: "center",
  },
  row: {},
  cell: {
    textAlign: "center",
  },
  day: {
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: theme.colors.heading,
    cursor: "pointer",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    height: 34,
    width: 34,
  },
  day_today: {
    border: `1px solid ${theme.colors.borderStrong}`,
  },
  day_selected: {
    background: theme.colors.primaryDeep,
    color: theme.colors.primaryText,
  },
  day_outside: {
    color: theme.colors.subtle,
    opacity: 0.5,
  },
  day_disabled: {
    color: theme.colors.subtle,
    opacity: 0.3,
  },
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 1,
    opacity: 0.92,
  },
  shell: {
    position: "relative",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  triggerPressed: {
    opacity: 0.9,
  },
  triggerOpen: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.primary,
  },
  triggerContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  triggerText: {
    fontWeight: "600",
  },
  popover: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    left: 0,
    marginTop: theme.spacing.xs,
    minWidth: 302,
    padding: theme.spacing.sm,
    position: "absolute",
    top: "100%",
    zIndex: 50,
    ...theme.elevation.soft,
  },
  timeSection: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  timeSelect: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderStyle: "solid",
    borderWidth: 1,
    color: theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    minHeight: 42,
    paddingBottom: 8,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    paddingTop: 8,
    width: "100%",
  },
});
