// Avatar.tsx — circular user avatar with initials, tinted by user tone.
// Ported from waves/project/components/theme.jsx `Avatar`.

import { StyleSheet, Text, View } from 'react-native';
import { FONTS, avatarColor } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';

export type AvatarUser = {
  initials: string;
  tone?: number;
};

type AvatarProps = {
  user: AvatarUser;
  size?: number;
  /** Width (px) of the surface-colored ring around the avatar. 0 for none. */
  border?: number;
};

export function Avatar({ user, size = 32, border = 0 }: AvatarProps) {
  const { palette } = useTheme();
  const tone = user.tone ?? 200;
  const { bg, fg } = avatarColor(tone, Boolean(palette.dark));
  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: bg,
          // Border effect: a colored ring matching the surface beneath,
          // implemented with a solid border since RN lacks inner box-shadow.
          ...(border > 0
            ? { borderWidth: border, borderColor: palette.surface }
            : null),
        },
      ]}
    >
      <Text
        style={{
          color: fg,
          fontFamily: FONTS.bodySemibold,
          fontSize: size * 0.4,
          letterSpacing: 0.2,
        }}
      >
        {user.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
