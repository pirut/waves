import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { adminAuth } from '@/firebaseAdmin';

export async function createContext({ req }: FetchCreateContextFnOptions) {
  // Get the authorization header
  const authHeader = req.headers.get('authorization');
  let user = null;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decodedToken = await adminAuth.verifyIdToken(token);
      user = decodedToken;
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
