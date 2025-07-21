# Tech Stack & Development

## Framework & Build System

- **Next.js 15.3.5** with App Router
- **React 19** with TypeScript
- **Turbopack** for development (faster builds)

## Styling & UI

- **Tailwind CSS 4.1.11** for styling
- **shadcn/ui** components for UI primitives (built on Radix UI)
- **Lucide React** for icons
- **next-themes** for dark/light mode support
- **class-variance-authority** for component variants

## Backend & Services

- **tRPC** for type-safe API layer with React Query integration
- **Firebase** for authentication, database, and storage
  - Firestore for data storage
  - Firebase Auth with Google login
  - Firebase Admin SDK for server-side operations
- **Google Maps API** via `@react-google-maps/api`
- **Zod** for runtime type validation

## Development Tools

- **ESLint** with Next.js config
- **PostCSS** with Tailwind

## Common Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Environment
# Requires .env.local with the following variables:

# Firebase Client
# NEXT_PUBLIC_FIREBASE_API_KEY
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# NEXT_PUBLIC_FIREBASE_PROJECT_ID
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin SDK (server-side)
# FIREBASE_PROJECT_ID
# FIREBASE_CLIENT_EMAIL
# FIREBASE_PRIVATE_KEY

# External APIs
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# NEXT_PUBLIC_UPLOADTHING_KEY
```

## Code Patterns

- Use `"use client"` directive for client-side components
- **tRPC** for type-safe API calls: `trpc.events.getAll.useQuery()`
- Firebase config in `src/firebase.ts` and `src/firebaseAdmin.ts`
- Custom hooks in `src/hooks/` (e.g., `useAuth`)
- tRPC routers in `src/server/routers/` with Zod validation
- API endpoint at `/api/trpc/[trpc]` for tRPC handler
- UI components use shadcn/ui + CVA pattern for variants
