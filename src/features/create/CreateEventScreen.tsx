// CreateEventScreen.tsx — new event form. Title, category chips, description,
// date/time, location, capacity. Ported from screens-hub.jsx `CreateScreen`.
//
// First-pass simplifications vs prototype:
//   - Date/time fields open a native DateTimePicker via platform-split helper.
//     (Not wired yet — shown as static value; implementation is TODO.)
//   - Location: read-only preview text. Map picker is a TODO.

import { useMutation } from 'convex/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { CategoryChip } from '@/src/components/CategoryChip';
import { FieldInput, FormField } from '@/src/components/FormField';
import { Icon } from '@/src/components/Icon';
import { CATEGORIES, type CategoryId } from '@/src/theme/tokens';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type CreateEventScreenProps = {
  onCancel: () => void;
  onCreated: (eventId: string) => void;
};

const DEFAULT_LAT = 37.76;
const DEFAULT_LNG = -122.43;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function CreateEventScreen({ onCancel, onCreated }: CreateEventScreenProps) {
  const { palette } = useTheme();
  const create = useMutation(api.events.create);

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<CategoryId>('cleanup');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 2 && description.trim().length > 10 && !submitting;

  const onPost = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // For first-pass: default to 7 days from now, 2 hours long.
      const startsAt = Date.now() + 7 * DAY_MS;
      const endsAt = startsAt + 2 * HOUR_MS;
      const eventId = await create({
        title: title.trim(),
        category: cat,
        description: description.trim(),
        startsAt,
        endsAt,
        location: location.trim() || 'San Francisco',
        address: address.trim() || '',
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        capacity,
        hours: 2,
        bring: [],
      });
      onCreated(eventId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not create event';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: palette.line,
          }}
        >
          <Pressable onPress={onCancel} hitSlop={12}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: palette.ink2 }}>
              Cancel
            </Text>
          </Pressable>
          <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 15, color: palette.ink }}>
            New event
          </Text>
          <Pressable
            onPress={onPost}
            disabled={!canSubmit}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: canSubmit ? palette.primary : palette.wash,
              minWidth: 56,
              alignItems: 'center',
            }}
          >
            {submitting ? (
              <ActivityIndicator color={palette.dark ? '#000' : '#fff'} />
            ) : (
              <Text
                style={{
                  color: canSubmit ? (palette.dark ? '#000' : '#fff') : palette.ink3,
                  fontFamily: FONTS.bodySemibold,
                  fontSize: 13,
                }}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 32,
              color: palette.ink,
              letterSpacing: -0.3,
              lineHeight: 36,
              marginBottom: 4,
            }}
          >
            Start a wave.
          </Text>
          <Text
            style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink3, marginBottom: 24 }}
          >
            Gather your neighbors for something good.
          </Text>

          <FormField label="Title">
            <FieldInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ocean Beach Sunrise Cleanup"
            />
          </FormField>

          <FormField label="Category">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.id}
                  cat={c}
                  active={cat === c.id}
                  onPress={() => setCat(c.id)}
                />
              ))}
            </ScrollView>
          </FormField>

          <FormField label="Description">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="A quick Saturday morning sweep before the crowds arrive…"
              placeholderTextColor={palette.ink3}
              multiline
              style={{
                minHeight: 100,
                padding: 14,
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                fontFamily: FONTS.body,
                fontSize: 14,
                color: palette.ink,
                lineHeight: 21,
                textAlignVertical: 'top',
              }}
            />
          </FormField>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Date">
                <View
                  style={{
                    height: 46,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="calendar" size={16} color={palette.ink3} />
                  <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink }}>
                    In 7 days
                  </Text>
                </View>
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Time">
                <View
                  style={{
                    height: 46,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="clock" size={16} color={palette.ink3} />
                  <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink }}>
                    8:00 AM
                  </Text>
                </View>
              </FormField>
            </View>
          </View>

          <FormField label="Location">
            <FieldInput
              value={location}
              onChangeText={setLocation}
              placeholder="Ocean Beach, SF"
            />
          </FormField>

          <FormField label="Address">
            <FieldInput
              value={address}
              onChangeText={setAddress}
              placeholder="Great Hwy & Judah St"
            />
          </FormField>

          <FormField label="Capacity">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: palette.line,
                backgroundColor: palette.surface,
              }}
            >
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink }}>
                {capacity} volunteers
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <StepButton
                  onPress={() => setCapacity((n) => Math.max(1, n - 5))}
                  label="−"
                />
                <StepButton
                  onPress={() => setCapacity((n) => Math.min(500, n + 5))}
                  label="+"
                />
              </View>
            </View>
          </FormField>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 0.5,
        borderColor: palette.line,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: palette.ink, fontFamily: FONTS.bodySemibold, fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}
