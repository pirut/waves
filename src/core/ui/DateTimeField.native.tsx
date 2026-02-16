import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type DateTimePickerMode = "date" | "time";

type Props = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  picker?: "datetime" | "date" | "time";
  minimumDate?: number;
  maximumDate?: number;
  minuteInterval?: 1 | 5 | 10 | 15 | 20 | 30;
};

function mergeDate(currentTimestamp: number, selectedDate: Date) {
  const next = new Date(currentTimestamp);
  next.setFullYear(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );
  return next.getTime();
}

function mergeTime(currentTimestamp: number, selectedDate: Date) {
  const next = new Date(currentTimestamp);
  next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
  return next.getTime();
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
  const [activeMode, setActiveMode] = useState<DateTimePickerMode | null>(null);
  const [focusedControl, setFocusedControl] = useState<DateTimePickerMode | null>(null);

  const selectedDate = useMemo(() => new Date(value), [value]);

  const onPickerChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (event.type === "dismissed" || !pickedDate || !activeMode) {
      setActiveMode(null);
      return;
    }

    if (activeMode === "date") {
      onChange(mergeDate(value, pickedDate));
    } else {
      onChange(mergeTime(value, pickedDate));
    }

    setActiveMode(null);
  };

  const controlBase: ViewStyle = {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  };

  const openPicker = (nextMode: DateTimePickerMode) => {
    setActiveMode(nextMode);
  };

  const renderSingleControl = (
    mode: DateTimePickerMode,
    heading: string,
    valueText: string,
  ) => (
    <Pressable
      onBlur={() => setFocusedControl(null)}
      onFocus={() => setFocusedControl(mode)}
      onPress={() => openPicker(mode)}
      style={[controlBase, focusedControl === mode ? styles.controlFocused : undefined]}>
      <AppText variant="caption" color={theme.colors.muted}>
        {heading}
      </AppText>
      <AppText color={theme.colors.heading} style={styles.valueText}>
        {valueText}
      </AppText>
    </Pressable>
  );

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>

      {picker === "datetime" ? (
        <View style={styles.controlsRow}>
          {renderSingleControl("date", "Date", format(selectedDate, "EEE, MMM d, yyyy"))}
          {renderSingleControl("time", "Time", format(selectedDate, "h:mm a"))}
        </View>
      ) : (
        <View style={styles.singleControlRow}>
          {picker === "date"
            ? renderSingleControl("date", "Date", format(selectedDate, "EEE, MMM d, yyyy"))
            : renderSingleControl("time", "Time", format(selectedDate, "h:mm a"))}
        </View>
      )}

      {activeMode ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={
            activeMode === "date" && maximumDate ? new Date(maximumDate) : undefined
          }
          minimumDate={
            activeMode === "date" && minimumDate ? new Date(minimumDate) : undefined
          }
          minuteInterval={minuteInterval}
          mode={activeMode}
          onChange={onPickerChange}
          value={selectedDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 1,
    opacity: 0.92,
  },
  controlsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  singleControlRow: {
    flexDirection: "row",
  },
  controlFocused: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.primaryDeep,
    shadowColor: "#26414f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  valueText: {
    fontWeight: "600",
    letterSpacing: 0.18,
  },
});
