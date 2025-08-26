import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Protected routes are now handled by client-side conditional layout

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for very specific Firebase Auth cookies that are more reliable
  const hasFirebaseSession = req.cookies.has('__session') || req.cookies.has('firebase-session');

  // Check for Authorization header (most reliable for API calls)
  const authHeader = req.headers.get('authorization');
  const hasAuthToken = authHeader?.startsWith('Bearer ');

  // Also check for any cookie that contains 'firebase' in the name (catch-all)
  const hasAnyFirebaseCookie = Array.from(req.cookies.getAll()).some((cookie) =>
    cookie.name.toLowerCase().includes('firebase')
  );

  // Check for any cookie that might indicate authentication
  const allCookies = Array.from(req.cookies.getAll());
  const hasAnyAuthCookie = allCookies.some(
    (cookie) =>
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('token')
  );

  const isAuthenticated =
    hasFirebaseSession || hasAuthToken || hasAnyFirebaseCookie || hasAnyAuthCookie;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware Debug:', {
      pathname,
      hasFirebaseSession,
      hasAuthToken,
      hasAnyFirebaseCookie,
      hasAnyAuthCookie,
      isAuthenticated,
      allCookies: allCookies.map((c) => c.name),
    });
  }

  // If user is authenticated and trying to access homepage, redirect to dashboard
  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // For now, let the client-side handle protected route redirects
  // This prevents false positives and allows for better user experience
  // The conditional layout will handle unauthenticated users gracefully

  // Optional domain split: redirect logged-in users to APP_SUBDOMAIN if configured
  // Requires NEXT_PUBLIC_APP_SUBDOMAIN (e.g., https://app.example.com)
  // and NEXT_PUBLIC_MAIN_DOMAIN (e.g., https://www.example.com)
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN;
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN;
  if (!appSubdomain || !mainDomain) return NextResponse.next();

  const url = new URL(req.url);

  // If visiting main domain and authed, send to app subdomain for protected experience
  if (url.origin.startsWith(mainDomain) && isAuthenticated) {
    const redirectUrl = new URL(url.pathname + url.search, appSubdomain);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};
