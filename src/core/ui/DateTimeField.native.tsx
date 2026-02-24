import { useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
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

function clampTimestamp(value: number, minimumDate?: number, maximumDate?: number) {
  if (minimumDate !== undefined && value < minimumDate) {
    return minimumDate;
  }
  if (maximumDate !== undefined && value > maximumDate) {
    return maximumDate;
  }
  return value;
}

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
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const selectedDate = useMemo(() => new Date(value), [value]);

  const formattedValue = useMemo(() => {
    if (picker === "date") {
      return format(selectedDate, "EEEE, MMMM d, yyyy");
    }

    if (picker === "time") {
      return format(selectedDate, "h:mm a");
    }

    return format(selectedDate, "EEEE, MMMM d • h:mm a");
  }, [picker, selectedDate]);

  const onApplyTimestamp = (nextTimestamp: number) => {
    onChange(clampTimestamp(nextTimestamp, minimumDate, maximumDate));
  };

  const onIosChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (event.type === "dismissed" || !pickedDate) {
      return;
    }

    if (picker === "date") {
      onApplyTimestamp(mergeDate(value, pickedDate));
      return;
    }

    if (picker === "time") {
      onApplyTimestamp(mergeTime(value, pickedDate));
    } else {
      onApplyTimestamp(pickedDate.getTime());
    }
  };

  const openAndroidDatePicker = (onSet: (pickedDate: Date) => void) => {
    DateTimePickerAndroid.open({
      mode: "date",
      value: selectedDate,
      minimumDate: minimumDate ? new Date(minimumDate) : undefined,
      maximumDate: maximumDate ? new Date(maximumDate) : undefined,
      design: "material",
      initialInputMode: "default",
      onChange: (event, pickedDate) => {
        if (event.type !== "set" || !pickedDate) {
          return;
        }
        onSet(pickedDate);
      },
    });
  };

  const openAndroidTimePicker = (baseTimestamp: number, onSet: (pickedTime: Date) => void) => {
    DateTimePickerAndroid.open({
      mode: "time",
      value: new Date(baseTimestamp),
      minuteInterval,
      design: "material",
      initialInputMode: "default",
      onChange: (event, pickedDate) => {
        if (event.type !== "set" || !pickedDate) {
          return;
        }
        onSet(pickedDate);
      },
    });
  };

  const openAndroidPicker = () => {
    if (picker === "date") {
      openAndroidDatePicker((pickedDate) => {
        onApplyTimestamp(mergeDate(value, pickedDate));
      });
      return;
    }

    if (picker === "time") {
      openAndroidTimePicker(value, (pickedTime) => {
        onApplyTimestamp(mergeTime(value, pickedTime));
      });
      return;
    }

    openAndroidDatePicker((pickedDate) => {
      const mergedDateTimestamp = mergeDate(value, pickedDate);
      openAndroidTimePicker(mergedDateTimestamp, (pickedTime) => {
        onApplyTimestamp(mergeTime(mergedDateTimestamp, pickedTime));
      });
    });
  };

  const openPicker = () => {
    if (Platform.OS === "android") {
      openAndroidPicker();
      return;
    }

    setIosPickerOpen((current) => !current);
  };

  const iosPickerMode: "datetime" | DateTimePickerMode = picker === "datetime" ? "datetime" : picker;
  const iOSDisplayStyle = picker === "time" ? "spinner" : "inline";
  const iconName = picker === "time" ? "schedule" : "event";

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.control,
          focused ? styles.controlFocused : undefined,
          pressed ? styles.controlPressed : undefined,
        ]}>
        <View style={styles.controlText}>
          <AppText variant="caption" color={theme.colors.muted}>
            {picker === "datetime" ? "Date and time" : picker === "date" ? "Date" : "Time"}
          </AppText>
          <AppText color={theme.colors.heading} style={styles.valueText}>
            {formattedValue}
          </AppText>
        </View>
        <MaterialIcons color={theme.colors.primary} name={iconName} size={20} />
      </Pressable>

      {Platform.OS === "ios" && iosPickerOpen ? (
        <View style={styles.iosPickerShell}>
          <DateTimePicker
            display={iOSDisplayStyle}
            maximumDate={maximumDate ? new Date(maximumDate) : undefined}
            minimumDate={minimumDate ? new Date(minimumDate) : undefined}
            minuteInterval={minuteInterval}
            mode={iosPickerMode}
            onChange={onIosChange}
            themeVariant={theme.mode === "dark" ? "dark" : "light"}
            value={selectedDate}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIosPickerOpen(false)}
            style={({ pressed }) => [
              styles.doneButton,
              pressed ? styles.controlPressed : undefined,
            ]}>
            <AppText color={theme.colors.primary} style={styles.doneButtonText}>
              Done
            </AppText>
          </Pressable>
        </View>
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
  control: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: theme.control.minTouchSize + 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  controlText: {
    flex: 1,
    gap: 2,
  },
  controlFocused: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.primaryDeep,
    shadowColor: theme.colors.primaryDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  controlPressed: {
    opacity: 0.82,
  },
  valueText: {
    fontWeight: "600",
    letterSpacing: 0.18,
  },
  iosPickerShell: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  doneButton: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
  },
  doneButtonText: {
    fontWeight: "700",
  },
});
