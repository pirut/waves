import { SignIn } from "@clerk/nextjs";

import { isClerkConfigured } from "@/lib/env";

export default function SignInPage() {
  const hasClerkServerEnv = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );

  if (!isClerkConfigured || !hasClerkServerEnv) {
    return (
      <div className="landing-page">
        <div className="viewer-state viewer-error">
          Clerk is not configured. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
          `CLERK_SECRET_KEY` in `web/.env.local`.
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
