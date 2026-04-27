// app/_layout.tsx — root layout.
//
// Wraps:
//   - ClerkProvider + ConvexProviderWithClerk for authenticated Convex requests
//   - ThemeProvider (palette + font loading)
//   - SafeAreaProvider
//   - GestureHandlerRootView + BottomSheetModalProvider (for sheets)
//
// Routes to (auth) or (tabs) based on auth state, with a splash screen while
// fonts + auth-state are resolving.

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convex } from '@/src/lib/convex';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'Clerk: Clerk has been loaded with development keys.',
  'Mapbox [error] MapLoad error HTTP status code 401.',
]);

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!clerkPublishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SafeAreaProvider>
          <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <AuthGate />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </ThemeProvider>
        </SafeAreaProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

/**
 * Gates the app to the (auth) or (tabs) route group based on auth state.
 * Lives inside ThemeProvider so useTheme() works here.
 */
function AuthGate() {
  const { fontsLoaded, palette } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootSegment = segments[0];
  const inAuthGroup = rootSegment === '(auth)';
  const shouldRedirectToApp = fontsLoaded && isLoaded && isSignedIn && inAuthGroup;
  const shouldRedirectToAuth = fontsLoaded && isLoaded && !isSignedIn && !inAuthGroup;

  // Hide splash once fonts are loaded.
  const onReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void onReady();
  }, [onReady]);

  useEffect(() => {
    if (!fontsLoaded || !isLoaded) return;

    if (shouldRedirectToApp) {
      router.replace('/');
    } else if (shouldRedirectToAuth) {
      router.replace('/sign-in');
    }
  }, [fontsLoaded, isLoaded, router, shouldRedirectToApp, shouldRedirectToAuth]);

  if (!fontsLoaded || !isLoaded || shouldRedirectToApp || shouldRedirectToAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <>
      {isSignedIn ? <BootstrapOnFirstAuth /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

/** One-shot init of the signed-in user's profile + seed data. Idempotent. */
function BootstrapOnFirstAuth() {
  const bootstrapMe = useMutation(api.seed.bootstrapMe);
  useEffect(() => {
    void bootstrapMe({}).catch(() => {
      // Seed might fail if schema isn't pushed yet — non-fatal.
    });
  }, [bootstrapMe]);
  return null;
}
