// auth.ts — Convex Auth setup.
//
// Providers:
//   - Password (email + password; works out of the box)
//   - Apple (requires AUTH_APPLE_ID + AUTH_APPLE_SECRET env vars)
//   - Google (requires AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET env vars)
//
// On Expo iOS, the client invokes Apple Sign-In via `expo-apple-authentication`
// and forwards the identity token to the `apple` provider. Google is handled
// by `expo-auth-session` issuing an idToken.

import Apple from '@auth/core/providers/apple';
import Google from '@auth/core/providers/google';
import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    // OAuth providers are only active when their env vars are set.
    // Otherwise `auth.config.ts` will still load but sign-in attempts
    // will return a "provider not configured" error from @auth/core.
    Google,
    Apple,
  ],
});
