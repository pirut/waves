import { Redirect, useLocalSearchParams } from "expo-router";

import { EventDetailScreen } from "@/src/modules/events/screens/EventDetailScreen";
import { useAppSession } from "@/src/lib/auth/useAppSession";

export default function EventDetailRoute() {
  const { isAuthenticated, isLoading } = useAppSession();
  const params = useLocalSearchParams<{ eventId: string }>();

  if (isLoading || !params.eventId) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <EventDetailScreen eventId={params.eventId} />;
}
