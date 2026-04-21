// FormField.tsx — labeled section wrapper used on Create Event.
// Ported from waves/project/components/screens-hub.jsx `FormField`.

import type { PropsWithChildren } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { FONTS, useTheme } from '@/theme/ThemeProvider';

type FormFieldProps = PropsWithChildren<{
  label: string;
}>;

export function FormField({ label, children }: FormFieldProps) {
  const { palette } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontFamily: FONTS.bodySemibold,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: palette.ink3,
          marginBottom: 8,
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
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: palette.line,
          backgroundColor: palette.surface,
          fontFamily: FONTS.body,
          fontSize: 14,
          color: palette.ink,
        },
        props.style,
      ]}
    />
  );
}
