# Clerk Setup

This repo already includes Clerk in the Expo app, native iOS project, and Convex client/server wiring. What still has to be configured is the Clerk dashboard side and the local environment.

## What is already wired in code

- `@clerk/expo` is installed and configured in [package.json](/Users/jrbussard/repos/waves/package.json:14) and [app.json](/Users/jrbussard/repos/waves/app.json:30).
- The app root wraps Expo with `ClerkProvider` and Convex with `ConvexProviderWithClerk` in [app/_layout.tsx](/Users/jrbussard/repos/waves/app/_layout.tsx:12).
- Convex validates Clerk JWTs in [convex/auth.config.ts](/Users/jrbussard/repos/waves/convex/auth.config.ts:1).
- Native iOS Clerk support is present in [ios/MakeWaves/ClerkViewFactory.swift](/Users/jrbussard/repos/waves/ios/MakeWaves/ClerkViewFactory.swift:1).
- The auth screens use Clerk’s current Expo Core 3 custom-flow APIs in [app/(auth)](</Users/jrbussard/repos/waves/app/(auth)>).

## Required dashboard setup

1. Create a Clerk application.
2. In Clerk, open `Native applications` and enable the Native API.
3. Register the native app identifiers:
   iOS bundle ID: `com.anonymous.make-waves`
   Android package: `com.anonymous.makewaves`
4. In Clerk, activate the Convex integration.
5. Copy the Clerk Frontend API URL / issuer domain.

Development issuer example:

```text
https://your-app.clerk.accounts.dev
```

Production issuer example:

```text
https://clerk.your-domain.com
```

## Required local environment

Add these to `.env.local`:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Notes:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*` will trigger a normal development warning in the console. That is expected.
- `CLERK_JWT_ISSUER_DOMAIN` must match the Clerk app that issued the publishable key.
- Convex expects Clerk’s JWT audience to be `convex`, which is what the Clerk Convex integration configures.

## Convex sync

After setting env vars, run:

```bash
npx convex dev
```

This pushes [convex/auth.config.ts](/Users/jrbussard/repos/waves/convex/auth.config.ts:1) to the active Convex deployment so Clerk JWTs can be validated.

## Run the app

Simulator:

```bash
npm run ios
```

Combined Convex + Expo:

```bash
npm run dev
```

## Current auth behavior

- Email/password sign-up sends an email verification code and finalizes the session after verification.
- Sign-in supports Clerk’s client-trust email code step when Clerk requires device verification.
- The sign-up screen includes the required `clerk-captcha` mount point for Clerk bot protection.

## Optional Clerk AI tooling

If you want AI coding tools on your machine to have Clerk-specific guidance, Clerk documents these optional additions:

```bash
npx skills add clerk/skills
```

Clerk also documents connecting its MCP server for agent tooling:

- https://clerk.com/docs/guides/ai/mcp/clerk-mcp-server.md
- https://clerk.com/docs/guides/ai/skills.md
