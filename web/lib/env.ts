export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const isConvexConfigured = Boolean(convexUrl);
export const isClerkConfigured = Boolean(clerkPublishableKey);
