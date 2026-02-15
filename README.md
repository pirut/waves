# Make Waves

Make Waves is a cross-platform charitable event app built with Expo (iOS, Android, Web) and Convex for realtime backend logic.

## Stack

- Expo Router + React Native Web for one codebase across mobile and website
- Clerk auth + Convex auth integration (`ConvexProviderWithClerk`)
- Convex for schema, queries, mutations, internal actions, and realtime updates
- TypeScript + Zod for strict types and validated input
- Shared UI primitives (`Button`, `Card`, `TextField`, `Screen`) for reusable, modular design

## Product capabilities in this foundation

- Discover nearby events on an interactive map and list (mobile + web)
- One-click RSVP (going/interested)
- Create events with details, image uploads (Convex file storage), location, timing, and impact goals
- "My Events" schedule (attending + hosting)
- Organizer dashboard with attendee tracking (`going` vs `interested`) and attendee messaging
- Email/push-ready notification queue with retry logic and cron dispatch
- Paginated attendee/message feeds for event detail scalability

## Local setup

1. Copy environment template and fill in real Clerk values:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start everything (Convex + Expo) in one command:

```bash
npm run dev
```

4. If you want automatic seed before starting development:

```bash
npm run dev:prime
```

5. (Optional) Seed demo data manually:

```bash
npm run convex:seed
```

6. Run only Expo (if Convex already running):

```bash
npm run start
```

Open web with `w`, iOS with `i`, Android with `a`.

7. Run on a remote dev server (portable scripts, no Homebrew path assumptions):

```bash
npm run dev:server
```

8. Run remote dev server with auto-seed:

```bash
npm run dev:server:prime
```

No deploy loop: `convex dev` watches local file changes and syncs functions to your dev deployment automatically. You only need `convex deploy` when you intentionally ship.

Note: Convex Node actions require Node 18/20/22.

## Required environment variables

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Local auth bypass for design testing (optional)

Use this only on local dev to skip Clerk login and test app UX end-to-end.

1. In `.env.local`, set:

```bash
EXPO_PUBLIC_LOCAL_AUTH_BYPASS=true
EXPO_PUBLIC_LOCAL_AUTH_BYPASS_DISPLAY_NAME="Local Design Tester"
EXPO_PUBLIC_LOCAL_AUTH_BYPASS_EMAIL="local-design@makewaves.test"
```

2. In your Convex dev deployment env, set:

```bash
npx convex env set LOCAL_AUTH_BYPASS true
npx convex env set LOCAL_AUTH_BYPASS_EXTERNAL_ID local-design-viewer
```

3. Restart `npm run dev`.

Notes:
- Expo bypass is hard-gated by `__DEV__`, so release builds ignore it.
- Convex bypass is disabled on `prod:` deployments even if the env var is set.
- Turn it off by setting both bypass flags back to `false`.

## Notification environment variables (optional but recommended)

- `RESEND_API_KEY`
- `NOTIFICATIONS_FROM_EMAIL`

## Project structure

- `convex/`
  Backend schema and API functions.
- `src/core/`
  Theme tokens and reusable UI primitives.
- `src/modules/events/`
  Event feature domain, hooks, components, and screens.
- `app/`
  Expo Router routes.

## Key Convex files

- `convex/schema.ts`
  Tables and indexes.
- `convex/events.ts`
  Event queries/mutations (discover, detail, create, RSVP, messaging) and paginated attendee/message queries.
- `convex/notifications.ts`
  Notification queue creation, pending delivery queries, and delivery status updates.
- `convex/notificationsActions.ts`
  Node action dispatcher for email/push sending and retry handling.
- `convex/crons.ts`
  Scheduled notification dispatch.
- `convex/viewer.ts`
  Authenticated Clerk user -> Convex profile sync.
- `convex/seed.ts`
  Idempotent demo data seeding (internal-only).
- `convex/files.ts`
  Upload URL generation and file URL lookup for Convex storage.
