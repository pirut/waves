import { Platform } from "react-native";

export const palette = {
  canvas: "#0f2129",
  sea: "#1f4a5b",
  lagoon: "#2f6a7a",
  mist: "#dce8e8",
  sand: "#f4f0e7",
  shell: "#fffdfa",
  driftwood: "#ded2c0",
  sun: "#b88646",
  coral: "#b85a4a",
  moss: "#3f7861",
  ink: "#1c262d",
  slate: "#4b5d67",
  white: "#ffffff",
  glass: "rgba(255, 253, 250, 0.86)",
} as const;

const displayFont =
  Platform.select({
    ios: "Iowan Old Style",
    android: "serif",
    web: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', serif",
    default: "System",
  }) ?? "System";

const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif",
    web: "'Trebuchet MS', 'Gill Sans', 'Avenir Next', sans-serif",
    default: "System",
  }) ?? "System";

export const theme = {
  colors: {
    background: palette.sand,
    elevated: palette.shell,
    elevatedMuted: "#f6f1e8",
    canvas: palette.canvas,
    primary: palette.lagoon,
    primaryDeep: palette.sea,
    sky: "#e6efef",
    primaryText: palette.white,
    accent: "#6e8f80",
    accentText: palette.ink,
    danger: palette.coral,
    coral: palette.coral,
    rose: "#cf9b82",
    heading: palette.ink,
    body: palette.slate,
    muted: "#5f6f78",
    subtle: "#8b9aa3",
    border: palette.driftwood,
    borderStrong: "#b9aa94",
    success: palette.moss,
    warning: palette.sun,
    glass: palette.glass,
    glowA: "#efe8d8",
    glowB: "#e7e2d8",
    glowC: "#dfe9e1",
    overlayStart: "rgba(31, 74, 91, 0.92)",
    overlayEnd: "rgba(22, 58, 70, 0.96)",
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
    md: 14,
    lg: 18,
    xl: 26,
    pill: 999,
  },
  fonts: {
    display: displayFont,
    body: bodyFont,
    mono: "SpaceMono",
  },
  typography: {
    hero: 42,
    h1: 34,
    h2: 26,
    h3: 20,
    body: 16,
    caption: 13,
    overline: 11,
  },
  elevation: {
    soft: {
      shadowColor: "#1a252e",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    strong: {
      shadowColor: "#141f26",
      shadowOffset: { width: 0, height: 22 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof theme;
