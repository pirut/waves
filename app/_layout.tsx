// app/_layout.tsx — root layout.
//
// Wraps:
//   - ConvexAuthProvider (token storage: expo-secure-store on native, localStorage on web)
//   - ThemeProvider (palette + font loading)
//   - SafeAreaProvider
//   - GestureHandlerRootView + BottomSheetModalProvider (for sheets)
//
// Routes to (auth) or (tabs) based on auth state, with a splash screen while
// fonts + auth-state are resolving.

import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convex } from '@/src/lib/convex';
import { getAuthStorage } from '@/src/lib/authStorage';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={getAuthStorage()}>
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
    </ConvexAuthProvider>
  );
}

/**
 * Gates the app to the (auth) or (tabs) route group based on auth state.
 * Lives inside ThemeProvider so useTheme() works here.
 */
function AuthGate() {
  const { fontsLoaded, palette } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Hide splash once fonts are loaded.
  const onReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void onReady();
  }, [onReady]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <>
      <AuthLoading>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </AuthLoading>
      <Authenticated>
        <BootstrapOnFirstAuth />
        <RedirectIfNotInTabs segments={segments} router={router} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </Authenticated>
      <Unauthenticated>
        <RedirectIfNotInAuth segments={segments} router={router} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      </Unauthenticated>
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

function RedirectIfNotInTabs({
  segments,
  router,
}: {
  segments: string[];
  router: ReturnType<typeof useRouter>;
}) {
  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (inAuth) {
      router.replace('/');
    }
  }, [segments, router]);
  return null;
}

function RedirectIfNotInAuth({
  segments,
  router,
}: {
  segments: string[];
  router: ReturnType<typeof useRouter>;
}) {
  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!inAuth) {
      router.replace('/sign-in');
    }
  }, [segments, router]);
  return null;
}
