import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BackHandler, Pressable, StyleSheet, View } from "react-native";
import { useCallback } from "react";

import { theme } from "@/src/core/theme/tokens";
import { EventDetailScreen } from "@/src/modules/events/screens/EventDetailScreen";
import { useAppSession } from "@/src/lib/auth/useAppSession";

export default function EventDetailRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSession();
  const params = useLocalSearchParams<{ eventId: string; origin?: string | string[] }>();
  const originParam = Array.isArray(params.origin) ? params.origin[0] : params.origin;
  const openedFromCreate = originParam === "create";

  useFocusEffect(
    useCallback(() => {
      if (!openedFromCreate) {
        return undefined;
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace("/(tabs)");
        return true;
      });

      return () => subscription.remove();
    }, [openedFromCreate, router]),
  );

  if (isLoading || !params.eventId) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      {openedFromCreate ? (
        <Stack.Screen
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerLeft: () => (
              <Pressable
                accessibilityLabel="Back to Discover"
                accessibilityRole="button"
                onPress={() => router.replace("/(tabs)")}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed ? styles.backButtonPressed : undefined,
                ]}>
                <View style={styles.backButtonInner}>
                  <Ionicons color={theme.colors.primary} name="chevron-back" size={19} />
                </View>
              </Pressable>
            ),
          }}
        />
      ) : null}
      <EventDetailScreen eventId={params.eventId} />
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
    paddingRight: theme.spacing.sm,
  },
  backButtonInner: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: theme.control.minTouchSize,
  },
  backButtonPressed: {
    opacity: 0.72,
  },
});
