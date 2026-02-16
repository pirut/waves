import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  localAuthBypassDisplayName,
  localAuthBypassEmail,
  localAuthBypassEnabled,
} from "@/src/lib/auth/devBypass";

type ViewerProfileState = {
  viewerProfileId: Id<"profiles"> | null;
  viewerIsReady: boolean;
  viewerError: string | null;
  viewerLoading: boolean;
};

const ViewerProfileContext = createContext<ViewerProfileState>({
  viewerProfileId: null,
  viewerIsReady: false,
  viewerError: null,
  viewerLoading: true,
});

export function ViewerProfileProvider({ children }: PropsWithChildren) {
  if (localAuthBypassEnabled) {
    return <BypassViewerProfileProvider>{children}</BypassViewerProfileProvider>;
  }

  return <ClerkViewerProfileProvider>{children}</ClerkViewerProfileProvider>;
}

function ClerkViewerProfileProvider({ children }: PropsWithChildren) {
  const syncCurrentUser = useMutation(api.viewer.syncCurrentUser);
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const initializedForUserRef = useRef<string | null>(null);
  const [state, setState] = useState<ViewerProfileState>({
    viewerProfileId: null,
    viewerIsReady: false,
    viewerError: null,
    viewerLoading: true,
  });

  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      initializedForUserRef.current = null;
      setState({
        viewerProfileId: null,
        viewerIsReady: false,
        viewerError: null,
        viewerLoading: false,
      });
      return;
    }

    if (initializedForUserRef.current === user.id) {
      return;
    }

    initializedForUserRef.current = user.id;
    let cancelled = false;

    const metadataCity =
      typeof user.publicMetadata?.city === "string" ? user.publicMetadata.city : undefined;

    const bootstrap = async () => {
      setState((current) => ({
        ...current,
        viewerLoading: true,
        viewerError: null,
      }));

      try {
        const viewerProfileId = await syncCurrentUser({
          avatarUrl: user.imageUrl,
          city: metadataCity,
          email: user.primaryEmailAddress?.emailAddress,
        });

        if (!cancelled) {
          setState({
            viewerProfileId,
            viewerIsReady: true,
            viewerError: null,
            viewerLoading: false,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            viewerProfileId: null,
            viewerIsReady: false,
            viewerError:
              error instanceof Error ? error.message : "Failed to initialize viewer profile",
            viewerLoading: false,
          });
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    authLoaded,
    isSignedIn,
    syncCurrentUser,
    user,
    userLoaded,
  ]);

  const value = useMemo(() => state, [state]);

  return <ViewerProfileContext.Provider value={value}>{children}</ViewerProfileContext.Provider>;
}

function BypassViewerProfileProvider({ children }: PropsWithChildren) {
  const syncCurrentUser = useMutation(api.viewer.syncCurrentUser);
  const initializedRef = useRef(false);
  const [state, setState] = useState<ViewerProfileState>({
    viewerProfileId: null,
    viewerIsReady: false,
    viewerError: null,
    viewerLoading: true,
  });

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      setState((current) => ({
        ...current,
        viewerLoading: true,
        viewerError: null,
      }));

      try {
        const viewerProfileId = await syncCurrentUser({
          displayName: localAuthBypassDisplayName,
          email: localAuthBypassEmail,
        });

        if (!cancelled) {
          setState({
            viewerProfileId,
            viewerIsReady: true,
            viewerError: null,
            viewerLoading: false,
          });
        }
      } catch (error) {
        if (!cancelled) {
          const fallbackError = "Failed to initialize local test profile";
          const rawMessage = error instanceof Error ? error.message : fallbackError;
          const setupHint =
            "Local auth bypass is enabled in Expo, but Convex bypass is off. Run `npx convex env set LOCAL_AUTH_BYPASS true` and restart `npx convex dev`.";

          setState({
            viewerProfileId: null,
            viewerIsReady: false,
            viewerError:
              rawMessage.includes("signed in") || rawMessage.includes("UNAUTHENTICATED")
                ? setupHint
                : rawMessage,
            viewerLoading: false,
          });
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [syncCurrentUser]);

  const value = useMemo(() => state, [state]);

  return <ViewerProfileContext.Provider value={value}>{children}</ViewerProfileContext.Provider>;
}

export function useViewerProfileContext() {
  return useContext(ViewerProfileContext);
}
