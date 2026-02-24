import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { clerkPublishableKey } from "@/src/lib/auth/config";
import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";
import { AppProviders } from "@/src/lib/providers/AppProviders";
import { convexUrl } from "@/src/lib/convexClient";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...(theme.mode === "dark" ? DarkTheme : DefaultTheme),
  colors: {
    ...(theme.mode === "dark" ? DarkTheme.colors : DefaultTheme.colors),
    background: theme.colors.background,
    border: theme.colors.border,
    card: theme.colors.elevated,
    primary: theme.colors.primary,
    text: theme.colors.heading,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!convexUrl) {
    return (
      <View style={styles.missingConfigShell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Convex URL missing
        </AppText>
        <AppText>
          Add `EXPO_PUBLIC_CONVEX_URL` to your local env and run `npx convex dev`.
        </AppText>
      </View>
    );
  }

  if (!clerkPublishableKey && !localAuthBypassEnabled) {
    return (
      <View style={styles.missingConfigShell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Clerk key missing
        </AppText>
        <AppText>
          Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to your local env to enable authentication.
        </AppText>
      </View>
    );
  }

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="events/[eventId]"
            options={{
              title: "Event Details",
              headerLargeTitle: Platform.OS === "ios",
              headerShadowVisible: false,
              headerTintColor: theme.colors.primary,
              headerStyle: { backgroundColor: theme.colors.background },
              headerTitleStyle: {
                color: theme.colors.heading,
                fontFamily: theme.fonts.body,
                fontWeight: "600",
              },
              headerBackTitle: "",
              headerBackButtonDisplayMode: "minimal",
            }}
          />
          <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  missingConfigShell: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
});
