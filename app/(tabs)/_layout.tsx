import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Redirect, Tabs, usePathname } from "expo-router";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppText } from "@/src/core/ui/AppText";
import { theme } from "@/src/core/theme/tokens";
import { useAppSession } from "@/src/lib/auth/useAppSession";

function TabBarIcon({
  focused,
  name,
  outlineName,
  color,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>["name"];
  outlineName: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons color={color} name={focused ? name : outlineName} size={20} />;
}

function WavesLogo({ color }: { color: string }) {
  return (
    <Svg fill="none" height={14} viewBox="0 0 64 28" width={30}>
      <Path
        d="M6 22c8.4-10.1 16.8-13.6 26-7.2 9.2-6.4 17.6-2.9 26 7.2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={6}
      />
      <Path
        d="M24 22c2.7-3.8 5-5.4 8-5.4s5.3 1.6 8 5.4"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={6}
      />
    </Svg>
  );
}

function CreateTabButton({
  accessibilityState,
  accessibilityLabel,
  forceFocused,
  onLongPress,
  onPress,
  testID,
}: BottomTabBarButtonProps & { forceFocused?: boolean }) {
  const focused = forceFocused || (accessibilityState?.selected ?? false);

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
      <View
        style={[
          styles.createTabButtonHalo,
          focused ? styles.createTabButtonHaloFocused : undefined,
        ]}
      />
      <View
        style={[
          styles.createTabButtonInner,
          focused ? styles.createTabButtonInnerFocused : undefined,
        ]}>
        {focused ? (
          <WavesLogo color={theme.colors.primaryText} />
        ) : (
          <Ionicons color={theme.colors.primaryText} name="add" size={28} />
        )}
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAppSession();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const createTabRouteFocused = /(^|\/)create(\/|$)/.test(pathname);
  const isPad = Platform.OS === "ios" && Platform.isPad;
  const tabBarBottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8;
  const tabBarHeight = (isPad ? 56 : 58) + tabBarBottomPadding;

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
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.surfaceGlassStrong,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          color: theme.colors.heading,
          fontFamily: theme.fonts.body,
          fontWeight: "700",
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
          lineHeight: 16,
          marginBottom: Platform.OS === "ios" ? 2 : 0,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarGlass,
          borderTopColor: theme.colors.glassBorderStrong,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarBottomPadding,
          paddingTop: isPad ? 7 : 8,
        },
        tabBarItemStyle: {
          minHeight: theme.control.minTouchSize,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} name="map" outlineName="map-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name="newspaper"
              outlineName="newspaper-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "",
          tabBarButton: (props) => <CreateTabButton {...props} forceFocused={createTabRouteFocused} />,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: "My Events",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name="calendar"
              outlineName="calendar-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name="person-circle"
              outlineName="person-circle-outline"
            />
          ),
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
    gap: 5,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    position: "relative",
    top: -11,
  },
  createTabButtonHalo: {
    backgroundColor: "transparent",
    borderRadius: 34,
    height: 68,
    opacity: 0,
    position: "absolute",
    width: 68,
  },
  createTabButtonHaloFocused: {
    backgroundColor: theme.mode === "dark" ? "rgba(10, 132, 255, 0.2)" : "rgba(10, 132, 255, 0.14)",
    opacity: 1,
  },
  createTabButtonInner: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.mode === "dark" ? "rgba(19, 24, 34, 0.86)" : "rgba(255, 255, 255, 0.96)",
    borderRadius: 29,
    borderWidth: 2.5,
    elevation: 6,
    height: 58,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.mode === "dark" ? 0.34 : 0.22,
    shadowRadius: 12,
    width: 58,
  },
  createTabButtonInnerFocused: {
    borderColor: theme.mode === "dark" ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0.94)",
    borderWidth: 3,
  },
  createTabButtonFocused: {
    opacity: 1,
  },
  createTabButtonPressed: {
    opacity: 0.84,
  },
});
