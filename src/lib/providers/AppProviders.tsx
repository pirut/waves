import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { PropsWithChildren } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";

import { clerkPublishableKey } from "@/src/lib/auth/config";
import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";
import { tokenCache } from "@/src/lib/auth/tokenCache";
import { convexClient } from "@/src/lib/convexClient";
import { ViewerProfileProvider } from "@/src/modules/events/providers/ViewerProfileProvider";

export function AppProviders({ children }: PropsWithChildren) {
  if (!convexClient) {
    return <>{children}</>;
  }

  if (localAuthBypassEnabled) {
    return (
      <ConvexProvider client={convexClient}>
        <ViewerProfileProvider>{children}</ViewerProfileProvider>
      </ConvexProvider>
    );
  }

  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <ViewerProfileProvider>{children}</ViewerProfileProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
