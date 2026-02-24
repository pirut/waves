import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/core/ui/AppText";
import { theme } from "@/src/core/theme/tokens";
import { useAppSession } from "@/src/lib/auth/useAppSession";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={20} {...props} />;
}

function CreateTabButton({
  accessibilityState,
  accessibilityLabel,
  onLongPress,
  onPress,
  testID,
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? "Create event"}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      hitSlop={8}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.createTabButtonShell,
        focused ? styles.createTabButtonFocused : undefined,
        pressed ? styles.createTabButtonPressed : undefined,
      ]}
      testID={testID}>
      <View style={styles.createTabButtonInner}>
        <Ionicons color={theme.colors.primaryText} name="add" size={28} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAppSession();
  const insets = useSafeAreaInsets();
  const isPad = Platform.OS === "ios" && Platform.isPad;
  const tabBarBottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 6;
  const tabBarHeight = (isPad ? 54 : 56) + tabBarBottomPadding;

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText>Checking session...</AppText>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          color: theme.colors.heading,
          fontFamily: theme.fonts.body,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0,
        },
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? theme.colors.tabBarGlass : theme.colors.elevated,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: tabBarBottomPadding,
          paddingTop: isPad ? 6 : 7,
        },
        tabBarItemStyle: {
          minHeight: theme.control.minTouchSize,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="map-outline" />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="newspaper-outline" />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "",
          tabBarButton: (props) => <CreateTabButton {...props} />,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: "My Events",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="calendar-outline" />,
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="person-circle-outline" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  createTabButtonShell: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    top: -15,
  },
  createTabButtonInner: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.background,
    borderRadius: 31,
    borderWidth: 4,
    elevation: 5,
    height: 62,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    width: 62,
  },
  createTabButtonFocused: {
    opacity: 1,
  },
  createTabButtonPressed: {
    opacity: 0.84,
  },
});
