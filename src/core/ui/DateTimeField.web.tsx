import { useMemo, type CSSProperties } from "react";
import { StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type Props = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  minimumDate?: number;
  maximumDate?: number;
};

function toDateTimeLocalValue(timestamp: number) {
  const date = new Date(timestamp);
  const localTimestamp = timestamp - date.getTimezoneOffset() * 60_000;
  return new Date(localTimestamp).toISOString().slice(0, 16);
}

export function DateTimeField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: Props) {
  const minValue = useMemo(
    () => (minimumDate ? toDateTimeLocalValue(minimumDate) : undefined),
    [minimumDate],
  );
  const maxValue = useMemo(
    () => (maximumDate ? toDateTimeLocalValue(maximumDate) : undefined),
    [maximumDate],
  );

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>
      <input
        max={maxValue}
        min={minValue}
        onChange={(event) => {
          const nextTimestamp = new Date(event.target.value).getTime();
          if (Number.isFinite(nextTimestamp)) {
            onChange(nextTimestamp);
          }
        }}
        step={300}
        style={styles.input as CSSProperties}
        type="datetime-local"
        value={toDateTimeLocalValue(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 5,
  },
  label: {
    marginLeft: 1,
    opacity: 0.92,
  },
  input: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderStyle: "solid",
    borderWidth: 1,
    color: theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    minHeight: 46,
    paddingBottom: 10,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingTop: 10,
    width: "100%",
  },
});
