// Pin.tsx — map pin shapes (ring / drop / tag).
// First-pass only renders the `ring` variant used by the Map/Home prototype.

import Svg, { Circle } from 'react-native-svg';
import { pinColor } from '@/theme/ThemeProvider';
import type { CategoryId } from '@/theme/tokens';

export type PinStyle = 'ring' | 'drop' | 'tag';

type PinProps = {
  catId: CategoryId;
  selected?: boolean;
  size?: number;
};

/** Ring pin — the default shown on Map/Home. */
export function Pin({ catId, selected = false, size = 18 }: PinProps) {
  const fill = pinColor(catId);
  const s = selected ? size * 1.4 : size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={fill} fillOpacity={selected ? 1 : 0.94} />
      <Circle cx="12" cy="12" r="4" fill="#fff" />
    </Svg>
  );
}
