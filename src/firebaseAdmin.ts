// src/firebaseAdmin.ts
import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const hasServiceAccount = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

let adminApp: App | null = null;

if (hasServiceAccount) {
  const firebaseAdminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  };

  adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApp();
}

const notConfiguredMessage =
  "Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env variables.";

export const adminDb = adminApp
  ? getFirestore(adminApp)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(notConfiguredMessage);
        },
      }
    ) as unknown as ReturnType<typeof getFirestore>);

export const adminAuth = adminApp
  ? getAuth(adminApp)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(notConfiguredMessage);
        },
      }
    ) as unknown as ReturnType<typeof getAuth>);
