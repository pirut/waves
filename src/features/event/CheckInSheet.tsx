// CheckInSheet.tsx — generated QR-ish pattern modal.
// Ported from screens-hub.jsx `CheckInSheet`.

import { useMutation } from 'convex/react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type CheckInSheetProps = {
  visible: boolean;
  eventId?: Id<'events'>;
  onClose: () => void;
};

const ON_SQUARES = [0, 1, 3, 5, 6, 11, 13, 17, 18, 20, 24, 28, 30, 32, 35];

export function CheckInSheet({ visible, eventId, onClose }: CheckInSheetProps) {
  const { palette } = useTheme();
  const checkIn = useMutation(api.checkIns.checkInToEvent);

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
              {Array.from({ length: 36 }).map((_, i) => {
                const x = (i % 6) * 24 + 8;
                const y = Math.floor(i / 6) * 24 + 8;
                const on = ON_SQUARES.includes(i);
                return (
                  <Rect
                    key={i}
                    x={x}
                    y={y}
                    width={16}
                    height={16}
                    rx={2}
                    fill={on ? palette.ink : palette.line}
                  />
                );
              })}
              <Rect x={4} y={4} width={40} height={40} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
              <Rect x={106} y={4} width={40} height={40} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
              <Rect x={4} y={106} width={40} height={40} rx={6} fill="none" stroke={palette.ink} strokeWidth={4} />
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

          <Pressable
            onPress={onManualCheckIn}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: palette.dark ? '#1a1a1a' : '#fff',
                fontFamily: FONTS.bodySemibold,
                fontSize: 14,
              }}
            >
              I'm signed in manually
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={{
              marginTop: 10,
              width: '100%',
              height: 40,
              borderRadius: 20,
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
