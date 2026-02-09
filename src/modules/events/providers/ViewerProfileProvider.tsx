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
          displayName: user.fullName ?? user.username ?? undefined,
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

export function useViewerProfileContext() {
  return useContext(ViewerProfileContext);
}
