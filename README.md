# Make Waves

Make Waves is a cross-platform charitable event app with native iOS/Android clients (Expo) and a dedicated website frontend (Next.js), all backed by the same Convex realtime backend.

## Stack

- Expo Router for native iOS + Android app experiences
- Next.js App Router in [`web/`](web/) for a dedicated, desktop-first web experience
- Clerk auth + Convex auth integration (`ConvexProviderWithClerk`)
- Convex for schema, queries, mutations, internal actions, and realtime updates
- TypeScript + Zod for strict types and validated input
- Shared UI primitives (`Button`, `Card`, `TextField`, `Screen`) for reusable, modular design

## Product capabilities in this foundation

- Discover nearby events and manage RSVPs across native + web clients
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

2. Install root dependencies:

```bash
npm install
```

3. Install dedicated web app dependencies:

```bash
npm --prefix web install
```

4. Start native development (Convex + Expo) in one command:

```bash
npm run dev
```

5. Start the dedicated web frontend:

```bash
npm run web:next
```

6. Start Convex + Expo + dedicated web together:

```bash
npm run dev:all
```

7. If you want automatic seed before starting development:

```bash
npm run dev:prime
```

8. (Optional) Seed demo data manually:

```bash
npm run convex:seed
```

9. Run only Expo (if Convex already running):

```bash
npm run start
```

`npm run start` now starts Expo Go on LAN and shows a QR code for iOS testing.
Open web with `w`, iOS simulator with `i`, Android emulator with `a`.

If you need a custom dev build instead of Expo Go:

```bash
npm run start:dev-client
```

10. Run on a remote dev server (portable scripts, no Homebrew path assumptions):

```bash
npm run dev:server
```

11. Run remote dev server with auto-seed:

```bash
npm run dev:server:prime
```

No deploy loop: `convex dev` watches local file changes and syncs functions to your dev deployment automatically. You only need `convex deploy` when you intentionally ship.

Note: Convex Node actions require Node 18/20/22.

## Required environment variables

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Required environment variables for dedicated web app (`web/.env.local`)

- `NEXT_PUBLIC_CONVEX_URL` (same value as `EXPO_PUBLIC_CONVEX_URL`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Vercel deployment (web)

`vercel.json` is configured to deploy the dedicated Next.js web app using:
- `version: 2` with `@vercel/next`
- `src: web/package.json` as the Next.js entrypoint

Set these Vercel Project Environment Variables:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

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
- `web/`
  Dedicated Next.js frontend for desktop-focused web UX.
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
