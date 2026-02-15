import { useAuth } from "@clerk/clerk-expo";

import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";

export function useAppSession() {
  if (localAuthBypassEnabled) {
    return {
      isLoading: false,
      isAuthenticated: true,
    };
  }

  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return {
      isLoading: true,
      isAuthenticated: false,
    };
  }

  return {
    isLoading: false,
    isAuthenticated: Boolean(isSignedIn),
  };
}
