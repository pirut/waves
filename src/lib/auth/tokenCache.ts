import * as SecureStore from "expo-secure-store";

const inMemoryTokenCache = new Map<string, string>();

export const tokenCache = {
  async getToken(key: string) {
    try {
      const secureStoreToken = await SecureStore.getItemAsync(key);
      return secureStoreToken ?? inMemoryTokenCache.get(key) ?? null;
    } catch {
      return inMemoryTokenCache.get(key) ?? null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Keep a fallback for web or restricted environments.
      inMemoryTokenCache.set(key, value);
    }
  },
};
