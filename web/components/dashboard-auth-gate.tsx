"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function DashboardAuthGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div className="viewer-state">Checking session...</div>;
  }

  if (!isSignedIn) {
    return <div className="viewer-state">Redirecting to sign in...</div>;
  }

  return <>{children}</>;
}
