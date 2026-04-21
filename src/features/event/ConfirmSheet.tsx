// ConfirmSheet.tsx — ripple-decor sign-up confirmation sheet.
// Ported from screens-hub.jsx `ConfirmSheet`. Modal uses RN's Modal; the
// ripple SVG is preserved 1:1.

import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from '@/src/components/Icon';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  dateLabel: string;
  onClose: () => void;
};

export function ConfirmSheet({ visible, title, dateLabel, onClose }: ConfirmSheetProps) {
  const { palette } = useTheme();

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
            overflow: 'hidden',
          }}
        >
          {/* Ripple decor */}
          <View
            style={{
              height: 160,
              overflow: 'hidden',
              backgroundColor: palette.wash,
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 300 160"
              style={{ position: 'absolute' }}
            >
              <Circle cx={150} cy={170} r={40} fill="none" stroke={palette.primary} strokeWidth={1.4} opacity={0.4} />
              <Circle cx={150} cy={170} r={70} fill="none" stroke={palette.primary} strokeWidth={1.2} opacity={0.34} />
              <Circle cx={150} cy={170} r={100} fill="none" stroke={palette.primary} strokeWidth={1.0} opacity={0.28} />
              <Circle cx={150} cy={170} r={130} fill="none" stroke={palette.primary} strokeWidth={0.8} opacity={0.22} />
              <Circle cx={150} cy={170} r={160} fill="none" stroke={palette.primary} strokeWidth={0.6} opacity={0.16} />
            </Svg>
            <View
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: [{ translateX: -32 }, { translateY: -32 }],
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: palette.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 24,
              }}
            >
              <Icon name="check" size={32} strokeWidth={2.4} color={palette.dark ? '#1a1a1a' : '#fff'} />
            </View>
          </View>

          <View style={{ padding: 24, paddingTop: 20, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 28,
                color: palette.ink,
                letterSpacing: -0.3,
                lineHeight: 32,
                textAlign: 'center',
              }}
            >
              You're in.
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: palette.ink2,
                marginTop: 8,
                lineHeight: 21,
                textAlign: 'center',
              }}
            >
              {title} is on {dateLabel}. We'll send a reminder the day before.
            </Text>

            <Pressable
              onPress={onClose}
              style={{
                marginTop: 20,
                width: '100%',
                height: 44,
                borderRadius: 22,
                backgroundColor: palette.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: palette.bg, fontFamily: FONTS.bodySemibold, fontSize: 14 }}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
