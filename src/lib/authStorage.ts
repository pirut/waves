// authStorage.ts — TokenStorage adapter for ConvexAuthProvider.
//
// On native: wraps expo-secure-store.
// On web: falls back to localStorage (matching ConvexAuthProvider's default),
//         so we only pass this adapter when we're actually on native.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type TokenStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

/**
 * SecureStore keys can only contain alphanumerics, `.`, `-`, `_`. Convex Auth's
 * default key scheme includes characters outside that set (e.g. slashes), so
 * we sanitize to be safe.
 */
function sanitizeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export const nativeSecureStorage: TokenStorage = {
  async getItem(key) {
    return await SecureStore.getItemAsync(sanitizeKey(key));
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(sanitizeKey(key), value);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(sanitizeKey(key));
  },
};

/** Returns the platform-correct storage — `undefined` on web means
 *  ConvexAuthProvider will use localStorage. */
export function getAuthStorage(): TokenStorage | undefined {
  return Platform.OS === 'web' ? undefined : nativeSecureStorage;
}
