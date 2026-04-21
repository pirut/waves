// app/(tabs)/hub.tsx — My Hub tab.

import { useRouter } from 'expo-router';
import { HubScreen } from '@/src/features/hub/HubScreen';

export default function HubTab() {
  const router = useRouter();
  return (
    <HubScreen
      onOpenEvent={(id) => router.push({ pathname: '/event/[id]', params: { id } })}
    />
  );
}
