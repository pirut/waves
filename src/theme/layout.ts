import { Platform, useWindowDimensions } from 'react-native';

export const UI = {
  gutter: 20,
  gutterWide: 28,
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    cta: 26,
    pill: 999,
  },
  touch: 44,
  screenMax: 980,
  contentMax: 720,
  detailMax: 1060,
} as const;

export function useResponsiveLayout(maxWidth: number = UI.contentMax) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 740;
  const isWide = width >= 980;
  const gutter = isTablet ? UI.gutterWide : UI.gutter;
  const contentWidth = Math.min(width - gutter * 2, maxWidth);
  const sideInset = Math.max(gutter, (width - contentWidth) / 2);

  return {
    width,
    height,
    isTablet,
    isWide,
    isWeb: Platform.OS === 'web',
    gutter,
    contentWidth,
    sideInset,
  };
}

export function cardShadow(dark?: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: dark ? 0.18 : 0.07,
    shadowRadius: 24,
    elevation: 3,
  };
}
