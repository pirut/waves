// tokens.ts — Make Waves palettes, type, categories.
// Sourced verbatim from waves/project/components/theme.jsx.
// All color strings are OKLCH; they are converted to hex at init by src/theme/oklch.ts
// because React Native StyleSheet does not accept `oklch()` literals.

export type PaletteId = 'tidepool' | 'garden' | 'midnight';

export type PaletteTokens = {
  id: PaletteId;
  label: string;
  dark?: boolean;
  // Surfaces
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  // Brand
  primary: string;
  primary2: string;
  accent: string;
  accent2: string;
  wash: string;
  success: string;
  // Map
  mapBg: string;
  mapLand: string;
  mapWater: string;
  mapRoad: string;
  mapRoadStroke: string;
  mapPark: string;
  mapLabel: string;
  pinOutline: string;
};

export const PALETTES: Record<PaletteId, PaletteTokens> = {
  tidepool: {
    id: 'tidepool',
    label: 'Tidepool',
    bg: 'oklch(0.97 0.01 85)',
    surface: 'oklch(1 0 0)',
    surface2: 'oklch(0.955 0.012 85)',
    ink: 'oklch(0.22 0.04 210)',
    ink2: 'oklch(0.45 0.03 210)',
    ink3: 'oklch(0.62 0.02 210)',
    line: 'oklch(0.89 0.012 210)',
    primary: 'oklch(0.42 0.09 195)',
    primary2: 'oklch(0.52 0.11 195)',
    accent: 'oklch(0.72 0.16 45)',
    accent2: 'oklch(0.62 0.18 35)',
    wash: 'oklch(0.93 0.03 200)',
    success: 'oklch(0.62 0.12 155)',
    mapBg: 'oklch(0.95 0.015 180)',
    mapLand: 'oklch(0.965 0.012 180)',
    mapWater: 'oklch(0.88 0.04 215)',
    mapRoad: 'oklch(1 0 0)',
    mapRoadStroke: 'oklch(0.88 0.012 200)',
    mapPark: 'oklch(0.9 0.05 150)',
    mapLabel: 'oklch(0.52 0.02 210)',
    pinOutline: '#ffffff',
  },
  garden: {
    id: 'garden',
    label: 'Garden',
    bg: 'oklch(0.96 0.015 90)',
    surface: 'oklch(1 0 0)',
    surface2: 'oklch(0.95 0.02 85)',
    ink: 'oklch(0.24 0.03 80)',
    ink2: 'oklch(0.44 0.025 80)',
    ink3: 'oklch(0.6 0.02 80)',
    line: 'oklch(0.88 0.02 80)',
    primary: 'oklch(0.38 0.08 145)',
    primary2: 'oklch(0.5 0.1 145)',
    accent: 'oklch(0.74 0.16 75)',
    accent2: 'oklch(0.65 0.18 65)',
    wash: 'oklch(0.93 0.035 140)',
    success: 'oklch(0.62 0.12 145)',
    mapBg: 'oklch(0.95 0.018 90)',
    mapLand: 'oklch(0.965 0.014 90)',
    mapWater: 'oklch(0.85 0.03 210)',
    mapRoad: 'oklch(1 0 0)',
    mapRoadStroke: 'oklch(0.88 0.018 90)',
    mapPark: 'oklch(0.88 0.06 140)',
    mapLabel: 'oklch(0.5 0.02 90)',
    pinOutline: '#ffffff',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    dark: true,
    bg: 'oklch(0.18 0.025 265)',
    surface: 'oklch(0.23 0.03 265)',
    surface2: 'oklch(0.27 0.035 265)',
    ink: 'oklch(0.96 0.01 100)',
    ink2: 'oklch(0.78 0.02 100)',
    ink3: 'oklch(0.6 0.02 100)',
    line: 'oklch(0.33 0.03 265)',
    primary: 'oklch(0.74 0.14 75)',
    primary2: 'oklch(0.8 0.15 70)',
    accent: 'oklch(0.78 0.13 195)',
    accent2: 'oklch(0.72 0.15 195)',
    wash: 'oklch(0.27 0.04 265)',
    success: 'oklch(0.78 0.14 155)',
    mapBg: 'oklch(0.16 0.025 265)',
    mapLand: 'oklch(0.22 0.03 265)',
    mapWater: 'oklch(0.14 0.04 245)',
    mapRoad: 'oklch(0.3 0.025 265)',
    mapRoadStroke: 'oklch(0.36 0.03 265)',
    mapPark: 'oklch(0.26 0.04 155)',
    mapLabel: 'oklch(0.7 0.02 100)',
    pinOutline: 'oklch(0.2 0.03 265)',
  },
};

// ─── Categories ─────────────────────────────────────────────────────
export type CategoryId =
  | 'cleanup'
  | 'food'
  | 'garden'
  | 'elders'
  | 'tutor'
  | 'animals'
  | 'blood'
  | 'outreach'
  | 'repairs';

// IconName is defined in src/components/Icon.tsx; we import the union
// only for category typing below to avoid a circular dep.
export type CategoryGlyph =
  | 'wave' | 'bowl' | 'sprout' | 'heart' | 'book' | 'paw' | 'drop' | 'hands' | 'wrench';

export type Category = {
  id: CategoryId;
  label: string;
  glyph: CategoryGlyph;
};

export const CATEGORIES: Category[] = [
  { id: 'cleanup', label: 'Cleanup', glyph: 'wave' },
  { id: 'food', label: 'Food drive', glyph: 'bowl' },
  { id: 'garden', label: 'Garden', glyph: 'sprout' },
  { id: 'elders', label: 'Elders', glyph: 'heart' },
  { id: 'tutor', label: 'Tutor', glyph: 'book' },
  { id: 'animals', label: 'Animals', glyph: 'paw' },
  { id: 'blood', label: 'Blood drive', glyph: 'drop' },
  { id: 'outreach', label: 'Outreach', glyph: 'hands' },
  { id: 'repairs', label: 'Repairs', glyph: 'wrench' },
];

// Per-category hue (OKLCH h). Chroma/lightness come from the palette.
// Single source of truth — replicated server-side in convex/lib/tones.ts.
export const CAT_TONE: Record<CategoryId, number> = {
  cleanup: 195,
  food: 35,
  garden: 145,
  elders: 355,
  tutor: 260,
  animals: 75,
  blood: 20,
  outreach: 220,
  repairs: 300,
};

// ─── Typography ─────────────────────────────────────────────────────
// These names must match the font names the @expo-google-fonts/* packages
// register via useFonts() in src/theme/ThemeProvider.tsx.
export const FONTS = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
} as const;
