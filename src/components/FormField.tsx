// FormField.tsx — labeled section wrapper used on Create Event.
// Ported from waves/project/components/screens-hub.jsx `FormField`.

import type { PropsWithChildren } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { UI } from '@/theme/layout';

type FormFieldProps = PropsWithChildren<{
  label: string;
}>;

export function FormField({ label, children }: FormFieldProps) {
  const { palette } = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontFamily: FONTS.bodySemibold,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: palette.ink3,
          marginBottom: 9,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

/** Default-styled text input matching the prototype's `inputStyle()`. */
export function FieldInput(props: TextInputProps) {
  const { palette } = useTheme();
  return (
    <TextInput
      placeholderTextColor={palette.ink3}
      {...props}
      style={[
        {
          width: '100%',
          minHeight: 48,
          paddingVertical: 13,
          paddingHorizontal: 14,
          borderRadius: UI.radius.md,
          borderWidth: 1,
          borderColor: palette.line,
          backgroundColor: palette.surface,
          fontFamily: FONTS.body,
          fontSize: 15,
          color: palette.ink,
        },
        props.style,
      ]}
    />
  );
}
