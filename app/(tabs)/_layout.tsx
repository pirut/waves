import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { AppText } from "@/src/core/ui/AppText";
import { theme } from "@/src/core/theme/tokens";
import { useAppSession } from "@/src/lib/auth/useAppSession";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={20} {...props} />;
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAppSession();

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
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primaryDeep,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.elevated,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, android: 66, default: 66 }),
          paddingBottom: Platform.select({ ios: 8, android: 6, default: 6 }),
          paddingTop: 8,
        },
        tabBarItemStyle: {
          minHeight: theme.control.minTouchSize,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="map-marker" />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="plus-circle" />,
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: "My Events",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="calendar" />,
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="user-circle" />,
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
});
