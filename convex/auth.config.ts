export default {
    providers: [
        {
            // Replace with your Clerk issuer domain before production deploys.
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
            applicationID: "convex",
        },
    ],
};
