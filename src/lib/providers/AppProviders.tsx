import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { PropsWithChildren } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { clerkPublishableKey } from "@/src/lib/auth/config";
import { tokenCache } from "@/src/lib/auth/tokenCache";
import { convexClient } from "@/src/lib/convexClient";
import { ViewerProfileProvider } from "@/src/modules/events/providers/ViewerProfileProvider";

export function AppProviders({ children }: PropsWithChildren) {
  if (!convexClient || !clerkPublishableKey) {
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
