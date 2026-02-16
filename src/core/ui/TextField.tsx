import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

type Props = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
  secureTextEntry?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secureTextEntry,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        onChangeText={onChangeText}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={secureTextEntry}
        selectionColor={theme.colors.primary}
        style={[styles.input, focused ? styles.inputFocused : undefined, multiline ? styles.multiline : undefined]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginLeft: 1,
    opacity: 0.95,
  },
  input: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
  },
  inputFocused: {
    borderColor: theme.colors.primaryDeep,
    backgroundColor: theme.colors.elevated,
    shadowColor: "#26414f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  multiline: {
    minHeight: 132,
    textAlignVertical: "top",
  },
});
