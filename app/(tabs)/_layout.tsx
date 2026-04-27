// app/(tabs)/_layout.tsx — bottom tabs with the custom floating-Create TabBar.
//
import { Tabs } from 'expo-router';
import { TabBar } from '@/src/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="hub" options={{ title: 'My Hub' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
