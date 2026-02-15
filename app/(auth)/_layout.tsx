import { Redirect, Stack } from "expo-router";

import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";

export default function AuthLayout() {
  if (localAuthBypassEnabled) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
    </Stack>
  );
}
