"use client";

import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <div className="landing-page">
        <div className="viewer-state viewer-error">
          Clerk is not configured. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-main" style={{ alignItems: "center", justifyContent: "center" }}>
        <SignIn forceRedirectUrl="/discover" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
