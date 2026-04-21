// oklch.ts — Runtime OKLCH → hex conversion via culori.
// React Native StyleSheet does not accept `oklch()` strings, so we convert
// the entire palette at theme-init time and memoize. For dynamic category
// tones we expose `oklchToHex()`.

import { formatHex, parse } from 'culori';
import { PALETTES, type PaletteId, type PaletteTokens } from './tokens';

export type PaletteHex = { [K in keyof PaletteTokens]: PaletteTokens[K] };

const memo = new Map<string, string>();

/**
 * Convert any CSS color string (including `oklch(L C H)`) to `#rrggbb`.
 * Memoizes per input. Returns the input unchanged if conversion fails
 * (so #hex and rgba() strings pass through).
 */
export function oklchToHex(input: string): string {
  if (!input) return input;
  // Already hex / rgba / named — leave alone.
  if (input.startsWith('#') || input.startsWith('rgb')) return input;
  const cached = memo.get(input);
  if (cached) return cached;
  try {
    const parsed = parse(input);
    if (!parsed) {
      memo.set(input, input);
      return input;
    }
    const hex = formatHex(parsed);
    const out = hex ?? input;
    memo.set(input, out);
    return out;
  } catch {
    memo.set(input, input);
    return input;
  }
}

/**
 * Compose an OKLCH color from (lightness, chroma, hue) tuple and return hex.
 * Used by `chipColor(catId, palette)` etc. — mirrors the prototype's
 * `oklch(${l} ${c} ${tone})` pattern exactly.
 */
export function oklch(l: number, c: number, h: number): string {
  return oklchToHex(`oklch(${l} ${c} ${h})`);
}

/**
 * Convert a PaletteTokens record of OKLCH strings into an equivalent record
 * of hex strings. Keys preserved; booleans (e.g. `dark`) passed through.
 */
function convertPalette(p: PaletteTokens): PaletteHex {
  const out: Partial<PaletteHex> = {};
  for (const [k, v] of Object.entries(p) as [keyof PaletteTokens, string | boolean | undefined][]) {
    if (typeof v === 'string') {
      // @ts-expect-error: narrowing Paletteokens value types.
      out[k] = oklchToHex(v);
    } else {
      // @ts-expect-error: passthrough non-string fields.
      out[k] = v;
    }
  }
  return out as PaletteHex;
}

// Pre-converted palettes.
const CONVERTED: Record<PaletteId, PaletteHex> = {
  tidepool: convertPalette(PALETTES.tidepool),
  garden: convertPalette(PALETTES.garden),
  midnight: convertPalette(PALETTES.midnight),
};

export function getHexPalette(id: PaletteId): PaletteHex {
  return CONVERTED[id];
}
