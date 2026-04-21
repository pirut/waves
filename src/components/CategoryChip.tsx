// CategoryChip.tsx — rounded pill with an icon + label, tinted by category tone.
// Ported from waves/project/components/screens-map.jsx `CategoryChip`.

import { Pressable, Text, View } from 'react-native';
import { CATEGORIES, type Category, type CategoryId } from '@/theme/tokens';
import { FONTS, badgeColor, chipColor, useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';

type CategoryChipProps = {
  cat: Category;
  active?: boolean;
  compact?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ cat, active = false, compact = false, onPress }: CategoryChipProps) {
  const { palette } = useTheme();
  const { bg, fg, border } = chipColor(cat.id, palette, active);
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: compact ? 6 : 8,
        paddingHorizontal: compact ? 10 : 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        flexShrink: 0,
      }}
    >
      <Icon name={cat.glyph} size={compact ? 13 : 15} color={fg} />
      <Text
        style={{
          fontFamily: FONTS.bodyMedium,
          fontSize: compact ? 12 : 13,
          color: fg,
        }}
      >
        {cat.label}
      </Text>
    </Pressable>
  );
}

type CategoryBadgeProps = {
  catId: CategoryId;
  size?: number;
};

export function CategoryBadge({ catId, size = 36 }: CategoryBadgeProps) {
  const { palette } = useTheme();
  const { bg, fg } = badgeColor(catId, palette);
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return null;
  // Slightly squared (30% radius) tile with glyph centered — matches
  // CategoryBadge in screens-map.jsx.
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={cat.glyph} size={size * 0.55} color={fg} />
    </View>
  );
}
