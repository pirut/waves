// auth.config.ts — Convex validates Clerk-issued JWTs using the issuer domain
// configured in the Clerk dashboard's Convex integration.

import type { AuthConfig } from 'convex/server';

const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkIssuerDomain) {
  throw new Error('Missing CLERK_JWT_ISSUER_DOMAIN');
}

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
