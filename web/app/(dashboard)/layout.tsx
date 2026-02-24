import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SiteNav } from "@/components/site-nav";
import { ViewerProvider } from "@/components/viewer-context";
import { ViewerGate } from "@/components/viewer-gate";
import { isClerkConfigured, isConvexConfigured } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isClerkConfigured) {
    return (
      <div className="dashboard-shell">
        <div className="viewer-state viewer-error">
          Clerk is not configured. Add the web auth env vars in `web/.env.local`.
        </div>
      </div>
    );
  }

  if (!isConvexConfigured) {
    return (
      <div className="dashboard-shell">
        <div className="viewer-state viewer-error">
          Convex is not configured. Add `NEXT_PUBLIC_CONVEX_URL` in `web/.env.local`.
        </div>
      </div>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <ViewerProvider>
      <div className="dashboard-shell">
        <SiteNav />
        <main className="dashboard-main">
          <ViewerGate>{children}</ViewerGate>
        </main>
      </div>
    </ViewerProvider>
  );
}
