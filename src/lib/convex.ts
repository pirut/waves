// convex.ts — client singleton + helpers.
// Separated out so it can be imported both by ConvexAuthProvider wiring
// and any bare-metal useQuery/useMutation calls that bypass auth.

import { ConvexReactClient } from 'convex/react';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  // Warn (not throw) so the typecheck and basic renders still pass
  // before the user has run `npx convex dev`.
  // eslint-disable-next-line no-console
  console.warn(
    '[convex] EXPO_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to provision a deployment and write it to .env.local.',
  );
}

export const convex = new ConvexReactClient(CONVEX_URL ?? 'https://missing.convex.cloud', {
  // Keep data alive across unmounts for smoother tab switches.
  unsavedChangesWarning: false,
});
