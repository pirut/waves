"use client";

import type { PropsWithChildren } from "react";

import { useViewer } from "@/components/viewer-context";

export function ViewerGate({ children }: PropsWithChildren) {
  const { viewerError, viewerLoading, viewerReady } = useViewer();

  if (viewerLoading) {
    return <div className="viewer-state">Preparing your account...</div>;
  }

  if (viewerError) {
    return <div className="viewer-state viewer-error">{viewerError}</div>;
  }

  if (!viewerReady) {
    return <div className="viewer-state">You need an active session to load this page.</div>;
  }

  return <>{children}</>;
}
