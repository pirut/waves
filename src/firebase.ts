// src/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;
if (isBrowser) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const auth: Auth = app ? getAuth(app) : ({} as unknown as Auth);
export const db: Firestore = app ? getFirestore(app) : ({} as unknown as Firestore);
export const storage: FirebaseStorage = app ? getStorage(app) : ({} as unknown as FirebaseStorage);
