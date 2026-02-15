import { useConvexAuth } from "convex/react";

import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";

export function useAppSession() {
  const convexAuth = useConvexAuth();

  if (localAuthBypassEnabled) {
    return {
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return convexAuth;
}
