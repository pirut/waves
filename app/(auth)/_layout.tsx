// app/(auth)/_layout.tsx — sign-in / sign-up stack.

import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function AuthLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: 'fade',
      }}
    />
  );
}
