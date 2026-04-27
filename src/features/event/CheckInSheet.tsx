// CheckInSheet.tsx — generated QR-ish pattern modal.
// Ported from screens-hub.jsx `CheckInSheet`.

import { useMutation } from 'convex/react';
import { useMemo } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/src/components/Button';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type CheckInSheetProps = {
  visible: boolean;
  eventId?: Id<'events'>;
  onClose: () => void;
};

const GRID = 8;
const FINDER_CELLS = new Set<number>();
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    FINDER_CELLS.add(r * GRID + c);
    FINDER_CELLS.add(r * GRID + (GRID - 1 - c));
    FINDER_CELLS.add((GRID - 1 - r) * GRID + c);
  }
}

// Deterministic 32-bit hash → cell on/off pattern keyed by eventId.
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function patternFor(eventId: string): boolean[] {
  const seed = hashSeed(eventId || 'event');
  const cells = GRID * GRID;
  const out = new Array<boolean>(cells);
  let state = seed || 1;
  for (let i = 0; i < cells; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    out[i] = (state & 1) === 1;
  }
  return out;
}

export function CheckInSheet({ visible, eventId, onClose }: CheckInSheetProps) {
  const { palette } = useTheme();
  const checkIn = useMutation(api.checkIns.checkInToEvent);
  const pattern = useMemo(() => patternFor(eventId ?? 'event'), [eventId]);

  const onManualCheckIn = async () => {
    if (!eventId) return onClose();
    try {
      await checkIn({ eventId });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      Alert.alert('Check-in failed', message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: palette.surface,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.ink3,
            }}
          >
            Check in
          </Text>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 26,
              color: palette.ink,
              letterSpacing: -0.3,
              marginTop: 4,
            }}
          >
            You're here!
          </Text>

          {/* QR-ish pattern */}
          <View
            style={{
              marginVertical: 20,
              width: 180,
              height: 180,
              borderRadius: 24,
              backgroundColor: palette.surface2,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={150} height={150} viewBox="0 0 150 150">
              {pattern.map((on, i) => {
                if (FINDER_CELLS.has(i)) return null;
                const col = i % GRID;
                const row = Math.floor(i / GRID);
                const cellSize = 150 / GRID;
                return (
                  <Rect
                    key={i}
                    x={col * cellSize + 2}
                    y={row * cellSize + 2}
                    width={cellSize - 4}
                    height={cellSize - 4}
                    rx={1.5}
                    fill={on ? palette.ink : 'transparent'}
                  />
                );
              })}
              {/* Finder anchors at three corners (top-left, top-right, bottom-left). */}
              <Rect x={4} y={4} width={42} height={42} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
              <Rect x={14} y={14} width={22} height={22} rx={3} fill={palette.ink} />
              <Rect x={104} y={4} width={42} height={42} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
              <Rect x={114} y={14} width={22} height={22} rx={3} fill={palette.ink} />
              <Rect x={4} y={104} width={42} height={42} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
              <Rect x={14} y={114} width={22} height={22} rx={3} fill={palette.ink} />
            </Svg>
          </View>

          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 13,
              color: palette.ink2,
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 19.5,
            }}
          >
            Show this to the host at the volunteer tent, or tap below to check in manually.
          </Text>

          <Button label="I'm here, check me in" onPress={onManualCheckIn} size="md" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{
              marginTop: 10,
              width: '100%',
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: palette.ink2, fontFamily: FONTS.body, fontSize: 13 }}>
              Close
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
