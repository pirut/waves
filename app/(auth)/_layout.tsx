// app/(auth)/_layout.tsx — sign-in / sign-up stack.

import { useAuth } from '@clerk/expo';
import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function AuthLayout() {
  const { isLoaded } = useAuth();
  const { palette } = useTheme();

  if (!isLoaded) {
    return null;
  }

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
