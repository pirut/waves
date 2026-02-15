# Make Waves Agent Guardrails

This repository is the long-term foundation for **Make Waves** (charitable events map + hosting + RSVP app).

## Current architecture

- Frontend: Expo Router (`app/`) with one cross-platform UI for iOS/Android/Web.
- Auth: Clerk (`@clerk/clerk-expo`) + Convex auth integration (`ConvexProviderWithClerk`).
- Backend: Convex (`convex/`) with typed queries/mutations/actions and strict validators.
- State model: one authenticated user profile per Clerk identity in `profiles`.

## Critical non-negotiables

1. Never trust client-provided profile IDs for authorization.
- Derive current user from `ctx.auth.getUserIdentity()` and `profiles.externalId`.
- Keep using `convex/lib/auth.ts` helpers (`requireAuthProfile`, etc.).

2. Keep seed flows internal only.
- `convex/seed.ts` is `internalMutation` on purpose.
- Do not expose demo seed mutations publicly.

3. Keep notification flow queue-based.
- Queue rows in `notificationDeliveries`.
- Dispatch from `convex/notificationsActions.ts`.
- Update delivery state via `convex/notifications.ts`.
- Keep cron trigger in `convex/crons.ts`.

4. Preserve scalable query patterns.
- Use paginated attendee/message queries (`listAttendeesPaginated`, `listMessagesPaginated`).
- Avoid unbounded `collect()`/large `take()` on growth paths.

5. Preserve UI modularity.
- Reuse shared primitives in `src/core/ui`.
- Prefer extending existing primitives (`Button`, `TextField`, `Card`) over creating one-off variants.

## Convex module map

- `convex/schema.ts`: authoritative schema/indexes.
- `convex/viewer.ts`: Clerk identity -> profile sync/update.
- `convex/events.ts`: event CRUD/discovery/RSVP/messaging + pagination.
- `convex/notifications.ts`: notification queue + delivery state transitions.
- `convex/notificationsActions.ts`: provider dispatch (Resend/Expo Push).
- `convex/crons.ts`: recurring dispatch.
- `convex/auth.config.ts`: Clerk provider configuration for Convex auth.

## Auth and data flow contract

1. User signs in via Clerk routes (`/(auth)/sign-in`, `/(auth)/sign-up`).
2. `ViewerProfileProvider` calls `api.viewer.syncCurrentUser` once per authenticated Clerk user.
3. Feature queries/mutations execute only for authenticated users and derive profile server-side.

## Env/config expectations

- Required client env: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Optional notifications env: `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`.
- Optional local-only auth bypass for UI/flow testing:
  - Expo (local dev only): `EXPO_PUBLIC_LOCAL_AUTH_BYPASS=true`
  - Convex dev env: `LOCAL_AUTH_BYPASS=true`
  - Optional profile identity knobs: `EXPO_PUBLIC_LOCAL_AUTH_BYPASS_DISPLAY_NAME`, `EXPO_PUBLIC_LOCAL_AUTH_BYPASS_EMAIL`, `LOCAL_AUTH_BYPASS_EXTERNAL_ID`
- `convex/auth.config.ts` domain must be replaced with the real Clerk issuer domain before production.

## Local verification checklist

Run before shipping:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx convex dev --once --typecheck enable
npm run typecheck
npx expo export --platform web
```

## Notes for future agents

- If you touch auth, start by checking `src/lib/providers/AppProviders.tsx`, `src/modules/events/providers/ViewerProfileProvider.tsx`, and `convex/lib/auth.ts`.
- For local UI/flow validation without real sign-in, prefer the built-in local auth bypass instead of weakening production auth logic.
- Keep bypass safety guarantees intact: Expo bypass must remain `__DEV__`-gated and Convex bypass must stay disabled on `prod:` deployments.
- If you touch messaging/notifications, verify queue creation + dispatch + cron still chain correctly.
- If you add new event list surfaces, default to pagination patterns rather than bulk list queries.
