// FiltersSheet.tsx — when / distance / category / commitment / access.
// Bottom-up modal. First pass keeps state local; Apply closes the sheet.
// Ported from screens-hub.jsx `FiltersSheet`.

import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryChip } from '@/src/components/CategoryChip';
import { Icon } from '@/src/components/Icon';
import { SectionTitle } from '@/src/components/SectionTitle';
import { CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type FiltersSheetProps = {
  visible: boolean;
  initialCats?: Set<CategoryId>;
  onApply: (cats: Set<CategoryId>) => void;
  onClose: () => void;
};

const WHEN_OPTIONS = ['Today', 'This week', 'This weekend', 'Next 30 days'];
const COMMITMENT_OPTIONS = ['< 1 hour', '1–3 hours', '3+ hours'];
const ACCESS_TAGS = ['Solo', 'With friends', 'Family-friendly', 'Wheelchair access'];

export function FiltersSheet({
  visible,
  initialCats,
  onApply,
  onClose,
}: FiltersSheetProps) {
  const { palette } = useTheme();
  const [cats, setCats] = useState<Set<CategoryId>>(initialCats ?? new Set());
  const [when, setWhen] = useState(1); // index
  const [commitment, setCommitment] = useState(1);

  const toggleCat = (id: CategoryId) => {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: palette.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
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
              paddingHorizontal: 20,
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
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Icon name="close" size={20} color={palette.ink2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4 }}>
            <SectionTitle>When</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {WHEN_OPTIONS.map((l, i) => {
                const active = when === i;
                return (
                  <Pressable
                    key={l}
                    onPress={() => setWhen(i)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.line,
                      backgroundColor: active ? palette.wash : palette.surface,
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
                      borderRadius: 14,
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

            <SectionTitle>Who I'm going with</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {ACCESS_TAGS.map((l) => (
                <View
                  key={l}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink2 }}>{l}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <Pressable
              onPress={() => setCats(new Set())}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 14, color: palette.ink }}>
                Clear
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onApply(cats);
                onClose();
              }}
              style={{
                flex: 2,
                height: 48,
                borderRadius: 24,
                backgroundColor: palette.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 14, color: palette.bg }}>
                Apply
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
