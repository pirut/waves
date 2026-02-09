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

Note: Convex Node actions require Node 18/20/22. In this repo, Convex scripts are pinned to Homebrew Node 22 at `/opt/homebrew/opt/node@22/bin`.

## Required environment variables

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

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
