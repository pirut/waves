// app/(auth)/_layout.tsx — sign-in / sign-up stack.

import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { palette } = useTheme();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
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
