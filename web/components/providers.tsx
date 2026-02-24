"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { PropsWithChildren } from "react";

import { clerkPublishableKey, convexUrl, isClerkConfigured } from "@/lib/env";

const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: PropsWithChildren) {
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  if (!convexClient) {
    return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
