import { DashboardAuthGate } from "@/components/dashboard-auth-gate";
import { SiteNav } from "@/components/site-nav";
import { ViewerProvider } from "@/components/viewer-context";
import { ViewerGate } from "@/components/viewer-gate";
import { isClerkConfigured, isConvexConfigured } from "@/lib/env";

export default function DashboardLayout({
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

  return (
    <ViewerProvider>
      <DashboardAuthGate>
        <div className="dashboard-shell">
          <SiteNav />
          <main className="dashboard-main">
            <ViewerGate>{children}</ViewerGate>
          </main>
        </div>
      </DashboardAuthGate>
    </ViewerProvider>
  );
}
