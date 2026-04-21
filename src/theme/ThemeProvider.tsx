// ThemeProvider.tsx — palette context + useTheme() hook.
// Also loads Google Fonts (Instrument Serif, Inter, JetBrains Mono) and
// gates render on font-load so the design renders in its correct type.

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useFonts as useInstrumentSerif, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { CAT_TONE, FONTS, type CategoryId, type PaletteId } from './tokens';
import { getHexPalette, oklch, type PaletteHex } from './oklch';

export type Theme = {
  palette: PaletteHex;
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
  fontsLoaded: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [paletteId, setPaletteId] = useState<PaletteId>('tidepool');

  // useInstrumentSerif is the single useFonts() call from @expo-google-fonts/*;
  // feed it every font family we want loaded.
  const [fontsLoaded] = useInstrumentSerif({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
  });

  const value = useMemo<Theme>(
    () => ({
      palette: getHexPalette(paletteId),
      paletteId,
      setPaletteId,
      fontsLoaded,
    }),
    [paletteId, fontsLoaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be called inside <ThemeProvider/>');
  return ctx;
}

// ─── Category tone helpers ─────────────────────────────────────────
// Mirror the prototype's `oklch(${l} ${c} ${tone})` composition exactly.

export function chipColor(
  catId: CategoryId,
  palette: PaletteHex,
  active: boolean,
): { bg: string; fg: string; border: string } {
  const tone = CAT_TONE[catId];
  if (active) {
    return {
      bg: oklch(palette.dark ? 0.35 : 0.9, 0.08, tone),
      fg: oklch(palette.dark ? 0.92 : 0.3, 0.09, tone),
      border: oklch(palette.dark ? 0.5 : 0.75, 0.12, tone),
    };
  }
  return { bg: palette.surface, fg: palette.ink2, border: palette.line };
}

export function badgeColor(catId: CategoryId, palette: PaletteHex): { bg: string; fg: string } {
  const tone = CAT_TONE[catId];
  return {
    bg: oklch(palette.dark ? 0.32 : 0.92, 0.05, tone),
    fg: oklch(palette.dark ? 0.85 : 0.35, 0.14, tone),
  };
}

export function pinColor(catId: CategoryId): string {
  // Palette-agnostic pin color per the plan's map design notes.
  return oklch(0.55, 0.16, CAT_TONE[catId]);
}

export function avatarColor(tone: number, dark: boolean): { bg: string; fg: string } {
  return {
    bg: oklch(dark ? 0.55 : 0.82, 0.12, tone),
    fg: oklch(dark ? 0.15 : 0.28, 0.08, tone),
  };
}

export { FONTS };
