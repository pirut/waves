const LOCAL_AUTH_BYPASS_FLAG = process.env.EXPO_PUBLIC_LOCAL_AUTH_BYPASS === "true";

export const localAuthBypassEnabled = __DEV__ && LOCAL_AUTH_BYPASS_FLAG;

export const localAuthBypassDisplayName =
  process.env.EXPO_PUBLIC_LOCAL_AUTH_BYPASS_DISPLAY_NAME?.trim() || "Local Design Tester";

const normalizedBypassEmail = process.env.EXPO_PUBLIC_LOCAL_AUTH_BYPASS_EMAIL?.trim();
export const localAuthBypassEmail = normalizedBypassEmail || undefined;
