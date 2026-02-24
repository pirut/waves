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
        clearButtonMode="while-editing"
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
    gap: theme.spacing.xs,
  },
  label: {
    marginLeft: 2,
    opacity: 0.95,
  },
  input: {
    backgroundColor: theme.colors.surfaceGlassStrong,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.lg + 2,
    borderWidth: 1,
    color: theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.body,
    minHeight: theme.control.minTouchSize + 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: theme.colors.focusRing,
    backgroundColor: theme.colors.surfaceGlass,
    shadowColor: theme.colors.primaryDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: theme.mode === "dark" ? 0.28 : 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  multiline: {
    minHeight: 148,
    textAlignVertical: "top",
  },
});
