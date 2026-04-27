// TabBar.tsx — custom bottom tab bar matching the prototype's 5-tab layout
// with a floating center Create pill. Designed for use as the `tabBar` prop
// of Expo Router's <Tabs> layout.
//
// Ported from waves/project/components/screens-map.jsx `TabBar`.

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { cardShadow, UI, useResponsiveLayout } from '@/theme/layout';
import { Icon, type IconName } from './Icon';

// Route-name -> (label, icon) mapping. Route names match the files under app/(tabs)/.
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Map', icon: 'map' },
  hub: { label: 'My Hub', icon: 'calendar' },
  activity: { label: 'Activity', icon: 'bell' },
  profile: { label: 'Profile', icon: 'user' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout(560);
  const visibleRoutes = state.routes.filter((route) => TAB_META[route.name]);

  const renderTab = (route: (typeof visibleRoutes)[number]) => {
    const meta = TAB_META[route.name];
    const index = state.routes.findIndex((item) => item.key === route.key);
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityLabel={meta.label}
        accessibilityState={focused ? { selected: true } : undefined}
        onPress={onPress}
        style={styles.tab}
      >
        <Icon
          name={meta.icon}
          size={22}
          color={focused ? palette.primary : palette.ink3}
          strokeWidth={focused ? 2 : 1.6}
        />
        <Text
          style={{
            fontFamily: FONTS.bodyMedium,
            fontSize: 10,
            color: focused ? palette.primary : palette.ink3,
            marginTop: 4,
            letterSpacing: 0.1,
          }}
        >
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.root,
        {
          left: layout.isTablet ? layout.sideInset : 0,
          right: layout.isTablet ? layout.sideInset : 0,
          bottom: layout.isTablet ? 12 : 0,
          maxWidth: layout.isTablet ? 560 : undefined,
          alignSelf: 'center',
          backgroundColor: palette.surface,
          borderColor: palette.line,
          borderTopWidth: layout.isTablet ? 1 : 0.5,
          borderWidth: layout.isTablet ? 1 : 0,
          borderRadius: layout.isTablet ? UI.radius.xl : 0,
          paddingTop: layout.isTablet ? 8 : 10,
          paddingBottom: 10 + insets.bottom,
          ...cardShadow(palette.dark),
        },
      ]}
    >
      <View style={styles.row}>
        {visibleRoutes.slice(0, 2).map(renderTab)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create"
          onPress={() => router.push('/create')}
          style={[
            styles.createBtn,
            {
              backgroundColor: palette.primary,
              shadowColor: palette.primary,
            },
          ]}
        >
          <Icon
            name="plus"
            size={22}
            strokeWidth={2.2}
            color={palette.dark ? '#1a1a1a' : '#fff'}
          />
        </Pressable>
        {visibleRoutes.slice(2).map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -4 }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
