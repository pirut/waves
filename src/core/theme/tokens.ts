export const palette = {
  deepOcean: '#052b36',
  seaBlue: '#0f4c5c',
  tideBlue: '#16697a',
  foam: '#dff7ff',
  mint: '#8de4af',
  sun: '#fcca46',
  coral: '#ff6f59',
  ink: '#102a43',
  slate: '#486581',
  white: '#ffffff',
  border: '#c5d9e2',
  mist: '#f4fbfe',
} as const;

export const theme = {
  colors: {
    background: palette.mist,
    elevated: palette.white,
    canvas: palette.deepOcean,
    primary: palette.tideBlue,
    primaryText: palette.white,
    accent: palette.mint,
    danger: palette.coral,
    heading: palette.ink,
    body: palette.slate,
    muted: '#7895a6',
    border: palette.border,
    success: '#2b9348',
    warning: palette.sun,
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
    md: 14,
    lg: 20,
    pill: 999,
  },
  typography: {
    hero: 30,
    h1: 26,
    h2: 22,
    h3: 18,
    body: 15,
    caption: 13,
    overline: 11,
  },
} as const;

export type Theme = typeof theme;
