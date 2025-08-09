import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Optional domain split: redirect logged-in users to APP_SUBDOMAIN if configured
// Requires NEXT_PUBLIC_APP_SUBDOMAIN (e.g., https://app.example.com)
// and NEXT_PUBLIC_MAIN_DOMAIN (e.g., https://www.example.com)

export function middleware(req: NextRequest) {
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN;
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN;
  if (!appSubdomain || !mainDomain) return NextResponse.next();

  const url = new URL(req.url);

  // We rely on auth cookie to detect logged-in state (tRPC sets Authorization header client-side,
  // so here we use a simple cookie marker if available; otherwise skip). You can wire this up later.
  const isAuthed = req.cookies.get('mw_authed')?.value === '1';

  // If visiting main domain and authed, send to app subdomain for protected experience
  if (url.origin.startsWith(mainDomain) && isAuthed) {
    const redirectUrl = new URL(url.pathname + url.search, appSubdomain);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};
