// Icon.tsx — original 24px stroke-based icon set, ported 1:1 from
// waves/project/components/theme.jsx. No emoji, no third-party icon libs.
//
// Path definitions are kept byte-identical to the prototype so the
// geometry matches the design exactly.

import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'wave'
  | 'bowl'
  | 'sprout'
  | 'heart'
  | 'book'
  | 'paw'
  | 'drop'
  | 'hands'
  | 'wrench'
  | 'plus'
  | 'search'
  | 'filter'
  | 'map'
  | 'list'
  | 'pin'
  | 'calendar'
  | 'clock'
  | 'users'
  | 'chat'
  | 'bell'
  | 'check'
  | 'close'
  | 'chevronR'
  | 'chevronL'
  | 'chevronD'
  | 'chevronU'
  | 'share'
  | 'flame'
  | 'ripple1'
  | 'ripple2'
  | 'sun'
  | 'link'
  | 'anchor'
  | 'circle'
  | 'arrowR'
  | 'gift'
  | 'home'
  | 'user'
  | 'settings';

type CommonStroke = {
  fill: 'none';
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
};

type Paths = Record<IconName, (c: CommonStroke) => ReactNode>;

const paths: Paths = {
  // ─── Category glyphs ──────────────────────────────────────────────
  wave: (c) => (
    <G {...c}>
      <Path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <Path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <Path d="M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </G>
  ),
  bowl: (c) => (
    <G {...c}>
      <Path d="M3 12h18" />
      <Path d="M4 12a8 8 0 0016 0" />
      <Path d="M9 6c0 1 1 1 1 2s-1 1-1 2" />
      <Path d="M14 5c0 1 1 1 1 2s-1 1-1 2" />
    </G>
  ),
  sprout: (c) => (
    <G {...c}>
      <Path d="M12 20v-7" />
      <Path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z" />
      <Path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5z" />
    </G>
  ),
  heart: (c) => (
    <G {...c}>
      <Path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
    </G>
  ),
  book: (c) => (
    <G {...c}>
      <Path d="M3 5v14l9-3 9 3V5l-9 3-9-3z" />
      <Path d="M12 8v11" />
    </G>
  ),
  paw: (c) => (
    <G {...c}>
      <Circle cx="6" cy="10" r="1.7" />
      <Circle cx="10" cy="6" r="1.7" />
      <Circle cx="14" cy="6" r="1.7" />
      <Circle cx="18" cy="10" r="1.7" />
      <Path d="M7 17c0-3 2-5 5-5s5 2 5 5-2 3-5 3-5 0-5-3z" />
    </G>
  ),
  drop: (c) => (
    <G {...c}>
      <Path d="M12 3c-4 5-6 8-6 11a6 6 0 0012 0c0-3-2-6-6-11z" />
    </G>
  ),
  hands: (c) => (
    <G {...c}>
      <Path d="M4 14l2-5 3 1 1 5" />
      <Path d="M20 14l-2-5-3 1-1 5" />
      <Path d="M9 14h6v4H9z" />
    </G>
  ),
  wrench: (c) => (
    <G {...c}>
      <Path d="M14 6a4 4 0 015 5l-10 10-4-4L15 7" />
      <Path d="M17 4l-2 2 2 2 2-2z" />
    </G>
  ),

  // ─── UI glyphs ───────────────────────────────────────────────────
  plus: (c) => (
    <G {...c}>
      <Path d="M12 5v14M5 12h14" />
    </G>
  ),
  search: (c) => (
    <G {...c}>
      <Circle cx="11" cy="11" r="6" />
      <Path d="M20 20l-4.3-4.3" />
    </G>
  ),
  filter: (c) => (
    <G {...c}>
      <Path d="M4 6h16M7 12h10M10 18h4" />
    </G>
  ),
  map: (c) => (
    <G {...c}>
      <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <Path d="M9 4v14M15 6v14" />
    </G>
  ),
  list: (c) => (
    <G {...c}>
      <Path d="M4 7h16M4 12h16M4 17h16" />
    </G>
  ),
  pin: (c) => (
    <G {...c}>
      <Path d="M12 3a6 6 0 016 6c0 5-6 12-6 12s-6-7-6-12a6 6 0 016-6z" />
      <Circle cx="12" cy="9" r="2" />
    </G>
  ),
  calendar: (c) => (
    <G {...c}>
      <Rect x="4" y="5" width="16" height="16" rx="2" />
      <Path d="M4 10h16M9 3v4M15 3v4" />
    </G>
  ),
  clock: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M12 8v4l3 2" />
    </G>
  ),
  users: (c) => (
    <G {...c}>
      <Circle cx="9" cy="8" r="3" />
      <Path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      <Circle cx="17" cy="9" r="2.5" />
      <Path d="M15 19c0-2 1-4 4-4s2 2 2 4" />
    </G>
  ),
  chat: (c) => (
    <G {...c}>
      <Path d="M4 6h16v10h-7l-4 4v-4H4z" />
    </G>
  ),
  bell: (c) => (
    <G {...c}>
      <Path d="M6 10a6 6 0 0112 0v4l2 3H4l2-3z" />
      <Path d="M10 20a2 2 0 004 0" />
    </G>
  ),
  check: (c) => (
    <G {...c}>
      <Path d="M5 12l4 4 10-10" />
    </G>
  ),
  close: (c) => (
    <G {...c}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </G>
  ),
  chevronR: (c) => (
    <G {...c}>
      <Path d="M9 6l6 6-6 6" />
    </G>
  ),
  chevronL: (c) => (
    <G {...c}>
      <Path d="M15 6l-6 6 6 6" />
    </G>
  ),
  chevronD: (c) => (
    <G {...c}>
      <Path d="M6 9l6 6 6-6" />
    </G>
  ),
  chevronU: (c) => (
    <G {...c}>
      <Path d="M6 15l6-6 6 6" />
    </G>
  ),
  share: (c) => (
    <G {...c}>
      <Circle cx="6" cy="12" r="2" />
      <Circle cx="18" cy="6" r="2" />
      <Circle cx="18" cy="18" r="2" />
      <Path d="M8 11l8-4M8 13l8 4" />
    </G>
  ),
  flame: (c) => (
    <G {...c}>
      <Path d="M12 3s6 5 6 11a6 6 0 01-12 0c0-3 2-4 2-7s4-4 4-4z" />
    </G>
  ),
  ripple1: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="3" />
    </G>
  ),
  ripple2: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="3" />
      <Circle cx="12" cy="12" r="7" />
    </G>
  ),
  sun: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="3.5" />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5" />
    </G>
  ),
  link: (c) => (
    <G {...c}>
      <Path d="M10 14a4 4 0 010-6l3-3a4 4 0 016 6l-1 1" />
      <Path d="M14 10a4 4 0 010 6l-3 3a4 4 0 01-6-6l1-1" />
    </G>
  ),
  anchor: (c) => (
    <G {...c}>
      <Circle cx="12" cy="6" r="2" />
      <Path d="M12 8v13" />
      <Path d="M6 13h12" />
      <Path d="M4 15a8 8 0 0016 0" />
    </G>
  ),
  circle: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="8" />
    </G>
  ),
  arrowR: (c) => (
    <G {...c}>
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </G>
  ),
  gift: (c) => (
    <G {...c}>
      <Rect x="4" y="10" width="16" height="10" rx="1" />
      <Path d="M12 10v10M4 14h16" />
      <Path d="M12 10c-2 0-4-1-4-3s2-2 4 0c2-2 4-2 4 0s-2 3-4 3z" />
    </G>
  ),
  home: (c) => (
    <G {...c}>
      <Path d="M4 11l8-7 8 7v9H4z" />
    </G>
  ),
  user: (c) => (
    <G {...c}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </G>
  ),
  settings: (c) => (
    <G {...c}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </G>
  ),
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = '#000', strokeWidth = 1.75 }: IconProps) {
  const common: CommonStroke = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const render = paths[name] ?? paths.pin;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(common)}
    </Svg>
  );
}
