// Button.tsx — shared CTA button primitive.
// Replaces the bespoke 48-52pt rounded Pressables sprinkled across screens.

import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
  View,
} from 'react-native';
import { Icon, type IconName } from './Icon';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { UI } from '@/src/theme/layout';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  icon,
  fullWidth = true,
  ...rest
}: ButtonProps) {
  const { palette } = useTheme();
  const isDisabled = disabled || loading;
  const height = size === 'lg' ? 52 : 44;
  const radius = size === 'lg' ? UI.radius.cta : UI.radius.md;

  const colors =
    variant === 'primary'
      ? {
          bg: isDisabled ? palette.wash : palette.primary,
          fg: isDisabled ? palette.ink3 : palette.onPrimary,
          border: 'transparent',
        }
      : variant === 'secondary'
        ? {
            bg: palette.surface,
            fg: palette.ink,
            border: palette.line,
          }
        : {
            bg: 'transparent',
            fg: isDisabled ? palette.ink3 : palette.primary,
            border: 'transparent',
          };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isDisabled ? { disabled: true } : undefined}
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => ({
        height,
        borderRadius: radius,
        backgroundColor: colors.bg,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: size === 'lg' ? 18 : 14,
        opacity: pressed && !isDisabled ? 0.85 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} color={colors.fg} />}
          <Text
            style={{
              color: colors.fg,
              fontFamily: FONTS.bodySemibold,
              fontSize: size === 'lg' ? 15 : 14,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Square icon-only button used next to a primary CTA (e.g. heart save). */
export function IconButton({
  icon,
  active = false,
  size = 'lg',
  accessibilityLabel,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  icon: IconName;
  active?: boolean;
  size?: ButtonSize;
  accessibilityLabel: string;
}) {
  const { palette } = useTheme();
  const dim = size === 'lg' ? 52 : 44;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active ? { selected: true } : undefined}
      {...rest}
      style={({ pressed }) => ({
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.line,
        backgroundColor: active ? palette.wash : palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={18} color={active ? palette.primary : palette.ink} />
    </Pressable>
  );
}

/** A row that lays out a primary `Button` next to optional `IconButton`s. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}
