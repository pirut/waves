// FiltersSheet.tsx — when / distance / category / commitment / access.
// Bottom-up modal. First pass keeps state local; Apply closes the sheet.
// Ported from screens-hub.jsx `FiltersSheet`.

import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/Button';
import { CategoryChip } from '@/src/components/CategoryChip';
import { Icon } from '@/src/components/Icon';
import { Pill } from '@/src/components/Pill';
import { SectionTitle } from '@/src/components/SectionTitle';
import { CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { UI, useResponsiveLayout } from '@/src/theme/layout';

type FiltersSheetProps = {
  visible: boolean;
  initialCats?: Set<CategoryId>;
  initialFilters?: MapFilterState;
  onApply: (cats: Set<CategoryId>, filters: MapFilterState) => void;
  onClose: () => void;
};

export type MapFilterState = {
  when: number;
  commitment: number;
  tags: string[];
};

const WHEN_OPTIONS = ['Today', 'This week', 'This weekend', 'Next 30 days'];
const COMMITMENT_OPTIONS = ['Any length', '< 2 hours', '2-3 hours', '3+ hours'];
const VIBE_TAGS = ['Waterfront', 'Family-friendly', 'Indoor', 'Hands-on'];
export const DEFAULT_MAP_FILTERS: MapFilterState = { when: 3, commitment: 0, tags: [] };

export function FiltersSheet({
  visible,
  initialCats,
  initialFilters = DEFAULT_MAP_FILTERS,
  onApply,
  onClose,
}: FiltersSheetProps) {
  const { palette } = useTheme();
  const layout = useResponsiveLayout(620);
  const initialCatKey = useMemo(
    () => Array.from(initialCats ?? []).sort().join('|'),
    [initialCats],
  );
  const [cats, setCats] = useState<Set<CategoryId>>(() => new Set(initialCats));
  const [when, setWhen] = useState(initialFilters.when);
  const [commitment, setCommitment] = useState(initialFilters.commitment);
  const [tags, setTags] = useState<Set<string>>(() => new Set(initialFilters.tags));

  useEffect(() => {
    if (visible) {
      setCats(new Set(initialCats));
      setWhen(initialFilters.when);
      setCommitment(initialFilters.commitment);
      setTags(new Set(initialFilters.tags));
    }
  }, [visible, initialCatKey, initialCats, initialFilters]);

  const toggleCat = (id: CategoryId) => {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: palette.bg,
            width: layout.isTablet ? layout.contentWidth : '100%',
            alignSelf: 'center',
            borderTopLeftRadius: UI.radius.xl,
            borderTopRightRadius: UI.radius.xl,
            borderBottomLeftRadius: layout.isTablet ? UI.radius.xl : 0,
            borderBottomRightRadius: layout.isTablet ? UI.radius.xl : 0,
            maxHeight: '85%',
            marginBottom: layout.isTablet ? 18 : 0,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: layout.gutter,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 24,
                color: palette.ink,
                letterSpacing: -0.3,
              }}
            >
              Filters
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={20} color={palette.ink2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
            <SectionTitle>When</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {WHEN_OPTIONS.map((l, i) => (
                <Pill key={l} label={l} active={when === i} onPress={() => setWhen(i)} />
              ))}
            </View>

            <SectionTitle>Category</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.id}
                  cat={c}
                  active={cats.has(c.id)}
                  onPress={() => toggleCat(c.id)}
                />
              ))}
            </View>

            <SectionTitle>Commitment</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {COMMITMENT_OPTIONS.map((l, i) => {
                const active = commitment === i;
                return (
                  <Pressable
                    key={l}
                    onPress={() => setCommitment(i)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: UI.radius.md,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.line,
                      backgroundColor: active ? palette.wash : palette.surface,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: 12,
                        color: active ? palette.primary : palette.ink2,
                      }}
                    >
                      {l}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <SectionTitle>Vibe</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {VIBE_TAGS.map((l) => (
                <Pill key={l} label={l} active={tags.has(l)} onPress={() => toggleTag(l)} />
              ))}
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: layout.gutter,
              paddingTop: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Button
                label="Clear"
                variant="secondary"
                onPress={() => {
                  setCats(new Set());
                  setWhen(DEFAULT_MAP_FILTERS.when);
                  setCommitment(DEFAULT_MAP_FILTERS.commitment);
                  setTags(new Set());
                }}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label="Apply"
                onPress={() => {
                  onApply(cats, { when, commitment, tags: Array.from(tags) });
                  onClose();
                }}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
