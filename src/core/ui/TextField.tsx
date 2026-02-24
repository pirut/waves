import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

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
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
  textContentType?: TextInputProps["textContentType"];
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secureTextEntry,
  autoCapitalize = "sentences",
  autoComplete,
  autoCorrect = true,
  returnKeyType,
  textContentType,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.muted} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType ?? "default"}
        keyboardAppearance={theme.mode === "dark" ? "dark" : "light"}
        multiline={multiline}
        onChangeText={onChangeText}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtle}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        selectionColor={theme.colors.primary}
        textContentType={textContentType}
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
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.elevated,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 1,
  },
  multiline: {
    minHeight: 132,
    textAlignVertical: "top",
  },
});
