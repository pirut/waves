import { Redirect } from "expo-router";

import { DiscoverMapScreen } from "@/src/modules/events/screens/DiscoverMapScreen";
import { useAppSession } from "@/src/lib/auth/useAppSession";

export default function DiscoverMapRoute() {
  const { isAuthenticated, isLoading } = useAppSession();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <DiscoverMapScreen />;
}
