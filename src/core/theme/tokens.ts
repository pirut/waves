import { Platform } from "react-native";

export const palette = {
  canvas: "#1C1C1E",
  sea: "#0059C8",
  lagoon: "#007AFF",
  mist: "#E5E5EA",
  sand: "#F2F2F7",
  shell: "#FFFFFF",
  driftwood: "#D1D1D6",
  sun: "#FF9F0A",
  coral: "#FF3B30",
  moss: "#34C759",
  ink: "#1C1C1E",
  slate: "#3C3C43",
  white: "#ffffff",
  glass: "#FFFFFF",
} as const;

const displayFont =
  Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    default: "System",
  }) ?? "System";

const bodyFont =
  Platform.select({
    ios: "System",
    android: "sans-serif",
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    default: "System",
  }) ?? "System";

const monoFont =
  Platform.select({
    ios: "Menlo",
    android: "monospace",
    web: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
    default: "System",
  }) ?? "System";

export const theme = {
  colors: {
    background: palette.sand,
    elevated: palette.shell,
    elevatedMuted: "#F2F2F7",
    canvas: palette.canvas,
    primary: palette.lagoon,
    primaryDeep: palette.sea,
    sky: "#EAF2FF",
    primaryText: palette.white,
    accent: "#30B0C7",
    accentText: palette.ink,
    danger: palette.coral,
    coral: palette.coral,
    rose: "#FF8E88",
    heading: palette.ink,
    body: palette.slate,
    muted: "#6D6D72",
    subtle: "#8E8E93",
    border: palette.driftwood,
    borderStrong: "#C7C7CC",
    success: palette.moss,
    warning: palette.sun,
    glass: palette.glass,
    glowA: "#F7F7FA",
    glowB: "#EFF1F6",
    glowC: "#ECEFF6",
    overlayStart: "#0A84FF",
    overlayEnd: "#0060DF",
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 10,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 999,
  },
  fonts: {
    display: displayFont,
    body: bodyFont,
    mono: monoFont,
  },
  typography: {
    hero: 38,
    h1: 34,
    h2: 28,
    h3: 22,
    body: 17,
    caption: 13,
    overline: 12,
  },
  control: {
    minTouchSize: 44,
  },
  elevation: {
    soft: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    strong: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
