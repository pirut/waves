import { FontAwesome } from "@expo/vector-icons";
import { format } from "date-fns";
import { type ChangeEvent, useMemo, type CSSProperties } from "react";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type PickerKind = "datetime" | "date" | "time";

type Props = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  picker?: PickerKind;
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

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDateInput(value: string) {
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function parseTimeInput(value: string) {
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

const rowStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  width: "100%",
};

const controlShellStyle: CSSProperties = {
  alignItems: "center",
  backgroundColor: theme.colors.elevatedMuted,
  border: `1px solid ${theme.colors.borderStrong}`,
  borderRadius: theme.radius.md,
  display: "flex",
  gap: 10,
  minHeight: 48,
  paddingLeft: 12,
  paddingRight: 10,
  width: "100%",
};

const inputStyle: CSSProperties = {
  appearance: "none",
  backgroundColor: "transparent",
  border: "none",
  color: theme.colors.heading,
  fontFamily: theme.fonts.body,
  fontSize: 15,
  fontWeight: 600,
  minHeight: 46,
  outline: "none",
  width: "100%",
};

type ControlProps = {
  kind: "date" | "time";
  value: Date;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  minDate?: string;
  maxDate?: string;
  minuteInterval: number;
};

function Control({ kind, value, onChange, minDate, maxDate, minuteInterval }: ControlProps) {
  const isDate = kind === "date";
  const valueText = isDate ? toDateInputValue(value) : toTimeInputValue(value);

  return (
    <label style={controlShellStyle}>
      <FontAwesome
        color={theme.colors.muted}
        name={isDate ? "calendar-o" : "clock-o"}
        size={16}
      />
      <input
        max={isDate ? maxDate : undefined}
        min={isDate ? minDate : undefined}
        onChange={onChange}
        step={isDate ? undefined : minuteInterval * 60}
        style={inputStyle}
        type={isDate ? "date" : "time"}
        value={valueText}
      />
    </label>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  picker = "datetime",
  minimumDate,
  maximumDate,
  minuteInterval = 5,
}: Props) {
  const selectedDate = useMemo(() => new Date(value), [value]);
  const minDate = minimumDate ? toDateInputValue(new Date(minimumDate)) : undefined;
  const maxDate = maximumDate ? toDateInputValue(new Date(maximumDate)) : undefined;

  const onChangeDate = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInput(event.target.value);
    if (!parsed) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setFullYear(parsed.year, parsed.month - 1, parsed.day);
    const nextTimestamp = clampTimestamp(mergedDate.getTime(), minimumDate, maximumDate);
    onChange(nextTimestamp);
  };

  const onChangeTime = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseTimeInput(event.target.value);
    if (!parsed) {
      return;
    }

    const mergedDate = new Date(value);
    mergedDate.setHours(parsed.hours, parsed.minutes, 0, 0);
    const nextTimestamp = clampTimestamp(mergedDate.getTime(), minimumDate, maximumDate);
    onChange(nextTimestamp);
  };

  const previewText =
    picker === "date"
      ? format(selectedDate, "EEEE, MMMM d, yyyy")
      : picker === "time"
        ? format(selectedDate, "h:mm a")
        : format(selectedDate, "EEEE, MMMM d, yyyy • h:mm a");

  return (
    <div style={containerStyle}>
      <AppText variant="caption" color={theme.colors.muted} style={{ marginLeft: 1, opacity: 0.95 }}>
        {label}
      </AppText>

      {picker === "datetime" ? (
        <div style={rowStyle}>
          <Control
            kind="date"
            maxDate={maxDate}
            minDate={minDate}
            minuteInterval={minuteInterval}
            onChange={onChangeDate}
            value={selectedDate}
          />
          <Control
            kind="time"
            minuteInterval={minuteInterval}
            onChange={onChangeTime}
            value={selectedDate}
          />
        </div>
      ) : picker === "date" ? (
        <Control
          kind="date"
          maxDate={maxDate}
          minDate={minDate}
          minuteInterval={minuteInterval}
          onChange={onChangeDate}
          value={selectedDate}
        />
      ) : (
        <Control
          kind="time"
          minuteInterval={minuteInterval}
          onChange={onChangeTime}
          value={selectedDate}
        />
      )}

      <AppText variant="caption" color={theme.colors.subtle} style={{ marginLeft: 1, opacity: 0.9 }}>
        {previewText}
      </AppText>
    </div>
  );
}
