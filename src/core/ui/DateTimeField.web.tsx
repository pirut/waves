import * as Popover from "@radix-ui/react-popover";
import { FontAwesome } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo, useState, type CSSProperties } from "react";
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

function clampTimestamp(value: number, minimumDate?: number, maximumDate?: number) {
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

const containerStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  width: "100%",
};

const triggerStyle: CSSProperties = {
  alignItems: "center",
  backgroundColor: theme.colors.elevatedMuted,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  color: theme.colors.heading,
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  minHeight: 46,
  padding: "10px 16px",
  width: "100%",
};

const triggerTextWrap: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: 12,
};

const popoverContentStyle: CSSProperties = {
  backgroundColor: theme.colors.elevated,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  boxShadow: "0 18px 50px rgba(8, 24, 39, 0.18)",
  minWidth: 326,
  padding: 12,
  zIndex: 80,
};

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
    marginTop: 4,
    width: "100%",
  },
  head_cell: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    fontWeight: 600,
    height: 24,
    textAlign: "center",
  },
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
    opacity: 0.55,
  },
  day_disabled: {
    color: theme.colors.subtle,
    opacity: 0.28,
  },
};

const footerStyle: CSSProperties = {
  borderTop: `1px solid ${theme.colors.border}`,
  display: "grid",
  gap: 8,
  marginTop: 10,
  paddingTop: 10,
};

const timeLabelStyle: CSSProperties = {
  color: theme.colors.muted,
  fontFamily: theme.fonts.body,
  fontSize: theme.typography.caption,
};

const timeSelectStyle: CSSProperties = {
  backgroundColor: theme.colors.elevatedMuted,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  color: theme.colors.heading,
  fontFamily: theme.fonts.body,
  fontSize: theme.typography.body,
  minHeight: 42,
  padding: "8px 10px",
  width: "100%",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const doneButtonStyle: CSSProperties = {
  backgroundColor: theme.colors.primaryDeep,
  border: "none",
  borderRadius: theme.radius.md,
  color: theme.colors.primaryText,
  cursor: "pointer",
  fontFamily: theme.fonts.body,
  fontSize: 13,
  fontWeight: 700,
  minHeight: 34,
  padding: "6px 12px",
};

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
  const timeOptions = useMemo(() => buildTimeOptions(minuteInterval), [minuteInterval]);

  const onSelectDate = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

    const nextTimestamp = clampTimestamp(mergedDate.getTime(), minimumDate, maximumDate);
    onChange(nextTimestamp);
  };

  const onSelectTime = (nextTimeValue: string) => {
    const parsed = parseTimeValue(nextTimeValue);
    if (!parsed) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setHours(parsed.hours, parsed.minutes, 0, 0);

    const nextTimestamp = clampTimestamp(mergedDate.getTime(), minimumDate, maximumDate);
    onChange(nextTimestamp);
  };

  const selectedTimeValue = `${selectedDate.getHours()}:${selectedDate.getMinutes()}`;

  return (
    <div style={containerStyle}>
      <AppText variant="caption" color={theme.colors.muted} style={{ marginLeft: 1, opacity: 0.92 }}>
        {label}
      </AppText>

      <Popover.Root onOpenChange={setIsOpen} open={isOpen}>
        <Popover.Trigger asChild>
          <button style={triggerStyle} type="button">
            <span style={triggerTextWrap}>
              <FontAwesome color={theme.colors.muted} name="calendar-o" size={16} />
              <span style={{ color: theme.colors.heading, fontFamily: theme.fonts.body, fontSize: 15, fontWeight: 600 }}>
                {format(selectedDate, "PPP • h:mm a")}
              </span>
            </span>
            <FontAwesome color={theme.colors.subtle} name={isOpen ? "chevron-up" : "chevron-down"} size={12} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            collisionPadding={16}
            side="bottom"
            sideOffset={8}
            style={popoverContentStyle}>
            <DayPicker
              fromDate={minimumDate ? new Date(minimumDate) : undefined}
              mode="single"
              onSelect={onSelectDate}
              selected={selectedDate}
              showOutsideDays
              styles={dayPickerStyles}
              toDate={maximumDate ? new Date(maximumDate) : undefined}
              weekStartsOn={0}
            />

            <div style={footerStyle}>
              <span style={timeLabelStyle}>Time</span>
              <select
                onChange={(event) => onSelectTime(event.target.value)}
                style={timeSelectStyle}
                value={selectedTimeValue}>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={actionsStyle}>
                <button onClick={() => setIsOpen(false)} style={doneButtonStyle} type="button">
                  Done
                </button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
