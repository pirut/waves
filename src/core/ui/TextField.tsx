import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/src/core/theme/tokens';
import { AppText } from '@/src/core/ui/AppText';

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
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={theme.colors.heading}>
        {label}
      </AppText>
      <TextInput
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline ? styles.multiline : undefined]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  input: {
    backgroundColor: '#f8feff',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.heading,
    fontSize: theme.typography.body,
    minHeight: 46,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
