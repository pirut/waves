"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api, type Id } from "@/lib/convex-api";

type ViewerContextValue = {
  viewerProfileId: Id<"profiles"> | null;
  viewerReady: boolean;
  viewerLoading: boolean;
  viewerError: string | null;
};

const initialContextValue: ViewerContextValue = {
  viewerProfileId: null,
  viewerReady: false,
  viewerLoading: true,
  viewerError: null,
};

const ViewerContext = createContext<ViewerContextValue>(initialContextValue);

export function ViewerProvider({ children }: PropsWithChildren) {
  const syncCurrentUser = useMutation(api.viewer.syncCurrentUser);
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const initializedForUserRef = useRef<string | null>(null);
  const [state, setState] = useState<ViewerContextValue>(initialContextValue);

  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      initializedForUserRef.current = null;
      setState({
        viewerProfileId: null,
        viewerReady: false,
        viewerLoading: false,
        viewerError: null,
      });
      return;
    }

    if (initializedForUserRef.current === user.id) {
      return;
    }

    initializedForUserRef.current = user.id;
    let cancelled = false;

    const bootstrap = async () => {
      setState((current) => ({
        ...current,
        viewerLoading: true,
        viewerError: null,
      }));

      const metadataCity =
        typeof user.publicMetadata?.city === "string" ? user.publicMetadata.city : undefined;

      try {
        const viewerProfileId = await syncCurrentUser({
          avatarUrl: user.imageUrl,
          city: metadataCity,
          email: user.primaryEmailAddress?.emailAddress,
        });

        if (!cancelled) {
          setState({
            viewerProfileId,
            viewerReady: true,
            viewerLoading: false,
            viewerError: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            viewerProfileId: null,
            viewerReady: false,
            viewerLoading: false,
            viewerError:
              error instanceof Error ? error.message : "Unable to initialize your profile.",
          });
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, isSignedIn, syncCurrentUser, user, userLoaded]);

  const value = useMemo(() => state, [state]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  return useContext(ViewerContext);
}
