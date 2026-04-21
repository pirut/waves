// app/(tabs)/index.tsx — Map/Home tab.

import { useRouter } from 'expo-router';
import { MapScreen } from '@/src/features/map/MapScreen';

export default function MapTab() {
  const router = useRouter();
  return (
    <MapScreen
      onOpenEvent={(id) => router.push({ pathname: '/event/[id]', params: { id } })}
    />
  );
}
