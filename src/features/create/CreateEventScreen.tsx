// CreateEventScreen.tsx — new event form. Title, category chips, description,
// date/time, location, capacity. Ported from screens-hub.jsx `CreateScreen`.
//
import { useMutation } from 'convex/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { cardShadow, UI, useResponsiveLayout } from '@/src/theme/layout';
import { WEST_PALM_BEACH, WPB_LANDMARKS } from '@/src/lib/places';
import { formatDateLabel } from '@/src/lib/date';

type CreateEventScreenProps = {
  onCancel: () => void;
  onCreated: (eventId: string) => void;
};

const DEFAULT_LAT = WEST_PALM_BEACH.lat;
const DEFAULT_LNG = WEST_PALM_BEACH.lng;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const DATE_OPTIONS = Array.from({ length: 14 }).map((_, i) => ({
  days: i + 1,
  label:
    i === 0
      ? 'Tomorrow'
      : formatDateLabel(Date.now() + (i + 1) * DAY_MS),
}));
const TIME_OPTIONS = [
  { label: '7:00 AM', hour: 7 },
  { label: '7:30 AM', hour: 7.5 },
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },
  { label: '12:00 PM', hour: 12 },
  { label: '2:00 PM', hour: 14 },
  { label: '4:00 PM', hour: 16 },
  { label: '5:30 PM', hour: 17.5 },
  { label: '6:30 PM', hour: 18.5 },
  { label: '7:30 PM', hour: 19.5 },
];

const BRING_SUGGESTIONS = [
  'Water bottle',
  'Comfortable shoes',
  'Sunscreen',
  'Hat',
  'Reusable bag',
  'Work gloves',
  'Snacks',
  'Beach towel',
];

export function CreateEventScreen({ onCancel, onCreated }: CreateEventScreenProps) {
  const { palette } = useTheme();
  const layout = useResponsiveLayout(720);
  const create = useMutation(api.events.create);

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<CategoryId>('cleanup');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [capacity, setCapacity] = useState(25);
  const [capacityText, setCapacityText] = useState('25');
  const [dateIndex, setDateIndex] = useState(3);
  const [timeIndex, setTimeIndex] = useState(3);
  const [bringList, setBringList] = useState<string[]>(['Water bottle', 'Comfortable shoes']);
  const [bringDraft, setBringDraft] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 2 && description.trim().length > 10 && !submitting;

  const onPost = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const selectedDate = DATE_OPTIONS[dateIndex];
      const selectedTime = TIME_OPTIONS[timeIndex];
      const startDate = new Date(Date.now() + selectedDate.days * DAY_MS);
      startDate.setHours(Math.floor(selectedTime.hour), (selectedTime.hour % 1) * 60, 0, 0);
      const startsAt = startDate.getTime();
      const endsAt = startsAt + 2 * HOUR_MS;
      const eventId = await create({
        title: title.trim(),
        category: cat,
        description: description.trim(),
        startsAt,
        endsAt,
        location: location.trim() || 'Downtown West Palm Beach',
        address: address.trim() || 'Clematis St, West Palm Beach, FL',
        lat,
        lng,
        capacity,
        hours: 2,
        bring: bringList,
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
            paddingHorizontal: layout.sideInset,
            paddingVertical: 12,
            borderBottomWidth: 1,
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
              minHeight: 36,
              borderRadius: UI.radius.pill,
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
          contentContainerStyle={{
            paddingHorizontal: layout.sideInset,
            paddingTop: layout.isTablet ? 28 : 16,
            paddingBottom: 100,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              padding: layout.isTablet ? 22 : 0,
              marginBottom: layout.isTablet ? 22 : 0,
              borderRadius: layout.isTablet ? UI.radius.xl : 0,
              backgroundColor: layout.isTablet ? palette.surface : 'transparent',
              borderWidth: layout.isTablet ? 1 : 0,
              borderColor: palette.line,
              ...(layout.isTablet ? cardShadow(palette.dark) : {}),
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: layout.isTablet ? 40 : 32,
                color: palette.ink,
                letterSpacing: -0.3,
                lineHeight: layout.isTablet ? 44 : 36,
                marginBottom: 4,
              }}
            >
              Start a wave.
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 15,
                lineHeight: 22,
                color: palette.ink3,
                marginBottom: layout.isTablet ? 0 : 24,
              }}
            >
              Gather your neighbors for something good.
            </Text>
          </View>

          <FormField label="Title">
            <FieldInput
              value={title}
              onChangeText={setTitle}
              placeholder="Lake Trail Cleanup Crew"
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
              placeholder="A quick Saturday morning sweep before the waterfront gets busy..."
              placeholderTextColor={palette.ink3}
              multiline
              style={{
                minHeight: 100,
                padding: 14,
                borderRadius: UI.radius.md,
                borderWidth: 1,
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Date: ${DATE_OPTIONS[dateIndex].label}`}
                  onPress={() => setDateModalOpen(true)}
                  style={{
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: UI.radius.md,
                    borderWidth: 1,
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="calendar" size={16} color={palette.ink3} />
                  <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 14, color: palette.ink }} numberOfLines={1}>
                    {DATE_OPTIONS[dateIndex].label}
                  </Text>
                  <Icon name="chevronR" size={14} color={palette.ink3} />
                </Pressable>
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Time">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Time: ${TIME_OPTIONS[timeIndex].label}`}
                  onPress={() => setTimeModalOpen(true)}
                  style={{
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: UI.radius.md,
                    borderWidth: 1,
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="clock" size={16} color={palette.ink3} />
                  <Text style={{ flex: 1, fontFamily: FONTS.body, fontSize: 14, color: palette.ink }} numberOfLines={1}>
                    {TIME_OPTIONS[timeIndex].label}
                  </Text>
                  <Icon name="chevronR" size={14} color={palette.ink3} />
                </Pressable>
              </FormField>
            </View>
          </View>

          <FormField label="Location">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingBottom: 10 }}
            >
              {WPB_LANDMARKS.map((lm) => {
                const active = location === lm.name;
                return (
                  <Pressable
                    key={lm.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${lm.name}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setLocation(lm.name);
                      setAddress(lm.address);
                      setLat(lm.lat);
                      setLng(lm.lng);
                    }}
                    style={{
                      minHeight: 38,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: UI.radius.pill,
                      backgroundColor: active ? palette.wash : palette.surface,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyMedium,
                        fontSize: 13,
                        color: active ? palette.primary : palette.ink2,
                      }}
                    >
                      {lm.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <FieldInput
              value={location}
              onChangeText={setLocation}
              placeholder="Downtown West Palm Beach"
            />
          </FormField>

          <FormField label="Address">
            <FieldInput
              value={address}
              onChangeText={setAddress}
              placeholder="Clematis St & Rosemary Ave"
            />
          </FormField>

          <FormField label="What to bring">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {bringList.map((tag) => (
                <Pressable
                  key={tag}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${tag}`}
                  onPress={() => setBringList((list) => list.filter((t) => t !== tag))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 32,
                    paddingHorizontal: 12,
                    borderRadius: UI.radius.pill,
                    backgroundColor: palette.wash,
                    borderWidth: 1,
                    borderColor: palette.primary,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 12, color: palette.primary }}>
                    {tag}
                  </Text>
                  <Icon name="close" size={12} color={palette.primary} />
                </Pressable>
              ))}
              {bringList.length === 0 && (
                <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3 }}>
                  Tap a suggestion or type your own.
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  value={bringDraft}
                  onChangeText={setBringDraft}
                  placeholder="Add an item…"
                  onSubmitEditing={() => {
                    const trimmed = bringDraft.trim();
                    if (trimmed && !bringList.includes(trimmed)) {
                      setBringList((list) => [...list, trimmed]);
                    }
                    setBringDraft('');
                  }}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add item"
                onPress={() => {
                  const trimmed = bringDraft.trim();
                  if (!trimmed || bringList.includes(trimmed)) return;
                  setBringList((list) => [...list, trimmed]);
                  setBringDraft('');
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: UI.radius.md,
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="plus" size={18} color={palette.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {BRING_SUGGESTIONS.filter((s) => !bringList.includes(s)).map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${s}`}
                  onPress={() => setBringList((list) => [...list, s])}
                  style={{
                    minHeight: 30,
                    paddingHorizontal: 10,
                    borderRadius: UI.radius.pill,
                    borderWidth: 1,
                    borderColor: palette.line,
                    backgroundColor: 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3 }}>
                    + {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <FormField label="Capacity">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
                paddingHorizontal: 14,
                minHeight: 56,
                borderRadius: UI.radius.md,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.surface,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <TextInput
                  value={capacityText}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                    setCapacityText(cleaned);
                    const n = Number.parseInt(cleaned, 10);
                    if (Number.isFinite(n)) setCapacity(Math.max(1, Math.min(500, n)));
                  }}
                  onBlur={() => {
                    const n = Number.parseInt(capacityText, 10);
                    const clamped = Number.isFinite(n) ? Math.max(1, Math.min(500, n)) : 1;
                    setCapacity(clamped);
                    setCapacityText(String(clamped));
                  }}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={4}
                  accessibilityLabel="Capacity"
                  style={{
                    minWidth: 48,
                    fontFamily: FONTS.bodySemibold,
                    fontSize: 18,
                    color: palette.ink,
                    paddingVertical: 8,
                  }}
                />
                <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: palette.ink3 }}>
                  volunteers
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <StepButton
                  onPress={() => {
                    const next = Math.max(1, capacity - 5);
                    setCapacity(next);
                    setCapacityText(String(next));
                  }}
                  label="-"
                  accessibilityLabel="Decrease capacity"
                />
                <StepButton
                  onPress={() => {
                    const next = Math.min(500, capacity + 5);
                    setCapacity(next);
                    setCapacityText(String(next));
                  }}
                  label="+"
                  accessibilityLabel="Increase capacity"
                />
              </View>
            </View>
          </FormField>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={dateModalOpen}
        title="When?"
        options={DATE_OPTIONS.map((d, i) => ({ key: String(i), label: d.label }))}
        selectedKey={String(dateIndex)}
        onSelect={(key) => {
          setDateIndex(Number.parseInt(key, 10));
          setDateModalOpen(false);
        }}
        onClose={() => setDateModalOpen(false)}
      />
      <PickerModal
        visible={timeModalOpen}
        title="What time?"
        options={TIME_OPTIONS.map((t, i) => ({ key: String(i), label: t.label }))}
        selectedKey={String(timeIndex)}
        onSelect={(key) => {
          setTimeIndex(Number.parseInt(key, 10));
          setTimeModalOpen(false);
        }}
        onClose={() => setTimeModalOpen(false)}
      />
    </SafeAreaView>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selectedKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: UI.radius.xl,
            borderTopRightRadius: UI.radius.xl,
            paddingTop: 12,
            paddingBottom: 32,
            maxHeight: '70%',
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: palette.line,
              marginBottom: 12,
            }}
          />
          <Text
            style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 16,
              color: palette.ink,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <ScrollView>
            {options.map((opt) => {
              const active = opt.key === selectedKey;
              return (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(opt.key)}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: active ? FONTS.bodySemibold : FONTS.body,
                      fontSize: 15,
                      color: active ? palette.primary : palette.ink,
                    }}
                  >
                    {opt.label}
                  </Text>
                  {active && <Icon name="check" size={18} color={palette.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StepButton({
  onPress,
  label,
  accessibilityLabel,
}: {
  onPress: () => void;
  label: string;
  accessibilityLabel?: string;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: palette.ink, fontFamily: FONTS.bodySemibold, fontSize: 18 }}>
        {label}
      </Text>
    </Pressable>
  );
}
