// app/(tabs)/_layout.tsx — bottom tabs with the custom floating-Create TabBar.
//
// The `create` tab is a stub: pressing it forwards to the root-level modal
// `app/create.tsx`. Everything else renders in place.

import { Tabs, useRouter } from 'expo-router';
import { TabBar } from '@/src/components/TabBar';

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="hub" options={{ title: 'My Hub' }} />
      <Tabs.Screen
        name="create"
        options={{ title: 'Create' }}
        listeners={{
          tabPress: (e) => {
            // Don't actually select the tab — open the modal instead.
            e.preventDefault();
            router.push('/create');
          },
        }}
      />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
