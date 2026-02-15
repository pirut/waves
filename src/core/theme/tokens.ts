import { Platform } from "react-native";

export const palette = {
  abyss: "#0f172a",
  deepOcean: "#1e293b",
  seaBlue: "#1e3a5f",
  tideBlue: "#2f5f8e",
  sky: "#d8e6f2",
  foam: "#f6f8fb",
  mint: "#7fb8ad",
  sun: "#d9b86a",
  coral: "#cb5d53",
  rose: "#cf8a77",
  ink: "#111827",
  slate: "#475467",
  white: "#ffffff",
  border: "#d5dde8",
  mist: "#eef2f7",
  cloud: "#f8fafc",
  glass: "rgba(255,255,255,0.86)",
} as const;

const displayFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-medium",
    web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: "System",
  }) ?? "System";

const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif",
    web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: "System",
  }) ?? "System";

export const theme = {
  colors: {
    background: "#f4f7fb",
    elevated: palette.white,
    elevatedMuted: palette.cloud,
    canvas: palette.abyss,
    primary: palette.tideBlue,
    primaryDeep: palette.seaBlue,
    sky: palette.sky,
    primaryText: palette.white,
    accent: palette.mint,
    accentText: palette.ink,
    danger: palette.coral,
    coral: palette.coral,
    rose: palette.rose,
    heading: palette.ink,
    body: palette.slate,
    muted: "#667085",
    subtle: "#8594a8",
    border: palette.border,
    borderStrong: "#b7c3d4",
    success: "#1f8f58",
    warning: palette.sun,
    glass: palette.glass,
    glowA: "#dce8f5",
    glowB: "#cedced",
    glowC: "#deebe6",
    overlayStart: "rgba(17, 24, 39, 0.84)",
    overlayEnd: "rgba(17, 24, 39, 0.92)",
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
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 999,
  },
  fonts: {
    display: displayFont,
    body: bodyFont,
    mono: "SpaceMono",
  },
  typography: {
    hero: 40,
    h1: 30,
    h2: 24,
    h3: 19,
    body: 15,
    caption: 12,
    overline: 11,
  },
  elevation: {
    soft: {
      shadowColor: '#0a2440',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.1,
      shadowRadius: 26,
      elevation: 5,
    },
    strong: {
      shadowColor: '#051221',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.2,
      shadowRadius: 36,
      elevation: 10,
    },
  },
} as const;

export type Theme = typeof theme;
