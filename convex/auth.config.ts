// auth.config.ts — Convex Auth needs a provider entry so it can verify
// identity tokens issued by itself.

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
};
