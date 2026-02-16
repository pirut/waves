import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/src/core/ui/AppText";
import { theme } from "@/src/core/theme/tokens";
import { useAppSession } from "@/src/lib/auth/useAppSession";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
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
        tabBarActiveTintColor: theme.colors.primaryText,
        tabBarInactiveTintColor: theme.colors.sky,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 11,
          letterSpacing: 0.55,
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: theme.colors.canvas,
          borderTopColor: "transparent",
          borderTopWidth: 0,
          borderRadius: 22,
          bottom: 12,
          height: 72,
          left: 14,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          right: 14,
          ...theme.elevation.strong,
        },
        tabBarItemStyle: {
          borderRadius: 16,
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
