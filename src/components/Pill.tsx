// Pill.tsx — shared pill/chip primitive used by tabs and filter selectors.
// Variants: 'inverse' (Hub tabs: ink-on-bg active) | 'wash' (FiltersSheet: primary tint active)

import { Pressable, type PressableProps, Text } from 'react-native';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { UI } from '@/src/theme/layout';

type PillProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  active: boolean;
  variant?: 'inverse' | 'wash';
};

export function Pill({ label, active, variant = 'wash', ...rest }: PillProps) {
  const { palette } = useTheme();

  const colors =
    variant === 'inverse'
      ? {
          bg: active ? palette.ink : 'transparent',
          fg: active ? palette.bg : palette.ink2,
          border: active ? 'transparent' : palette.line,
        }
      : {
          bg: active ? palette.wash : palette.surface,
          fg: active ? palette.primary : palette.ink2,
          border: active ? palette.primary : palette.line,
        };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      {...rest}
      style={({ pressed }) => ({
        minHeight: 38,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: UI.radius.pill,
        backgroundColor: colors.bg,
        borderWidth: variant === 'inverse' && active ? 0 : 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: FONTS.bodyMedium,
          fontSize: 13,
          color: colors.fg,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
