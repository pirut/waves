// app/(tabs)/activity.tsx — Notifications tab.

import { useRouter } from 'expo-router';
import { ActivityScreen } from '@/src/features/activity/ActivityScreen';

export default function ActivityTab() {
  const router = useRouter();
  return (
    <ActivityScreen
      onOpenEvent={(id) => router.push({ pathname: '/event/[id]', params: { id } })}
    />
  );
}
