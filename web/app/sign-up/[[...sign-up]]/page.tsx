"use client";

import { SignUp } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";

export default function SignUpPage() {
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
        <SignUp forceRedirectUrl="/discover" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
