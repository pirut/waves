// app/create.tsx — Create Event modal presentation.

import { useRouter } from 'expo-router';
import { CreateEventScreen } from '@/src/features/create/CreateEventScreen';

export default function CreateEventRoute() {
  const router = useRouter();
  return (
    <CreateEventScreen
      onCancel={() => router.back()}
      onCreated={(id) => {
        // Replace so the user lands on the event detail, not back on the
        // Create modal if they hit back.
        router.replace({ pathname: '/event/[id]', params: { id } });
      }}
    />
  );
}
