import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Redirect, Tabs } from "expo-router";
import { useConvexAuth } from "convex/react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/src/core/ui/AppText";
import { theme } from "@/src/core/theme/tokens";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#7a97a8",
        tabBarStyle: {
          backgroundColor: "#f8fdff",
          borderTopColor: "#d8e9f0",
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
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
          title: "Host",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="bullhorn" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: "center",
    backgroundColor: "#f8fdff",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
});
