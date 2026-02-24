import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { DateTimeField } from "@/src/core/ui/DateTimeField";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { EventMap } from "@/src/modules/events/components/EventMap";
import type { FocusLocation } from "@/src/modules/events/components/EventMap.types";
import { EVENT_CATEGORIES } from "@/src/modules/events/domain/types";
import {
  CREATE_EVENT_MIN_DESCRIPTION_CHARS,
  createEventInputSchema,
} from "@/src/modules/events/domain/validation";
import { useFileUpload } from "@/src/modules/events/hooks/useFileUpload";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";
import { formatEventWindow } from "@/src/modules/events/utils/formatters";

type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
  city?: string;
  region?: string;
  country: string;
  postalCode?: string;
};

const HOUR_MS = 1000 * 60 * 60;
const MIN_EVENT_DURATION_MS = 1000 * 60 * 30;
const DEFAULT_EVENT_DURATION_MS = HOUR_MS * 3;
const QUICK_DURATION_OPTIONS = [60, 90, 120, 180, 240] as const;

export function CreateEventScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();
  const { width } = useWindowDimensions();
  const isWideLayout = (Platform.OS === "ios" && Platform.isPad) || width >= 1024;

  const createEvent = useMutation(api.events.create);
  const lookupAddress = useAction(api.geocoding.search);
  const { uploadAsset } = useFileUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [impactSummary, setImpactSummary] = useState("");
  const [hasCapacityLimit, setHasCapacityLimit] = useState(false);
  const [capacity, setCapacity] = useState("");

  const [coverStorageId, setCoverStorageId] = useState<Id<"_storage"> | null>(null);
  const [coverPreviewUri, setCoverPreviewUri] = useState<string | null>(null);
  const [galleryUploads, setGalleryUploads] = useState<
    Array<{ storageId: Id<"_storage">; previewUri: string }>
  >([]);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationResults, setLocationResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);

  const [startAt, setStartAt] = useState(Date.now() + HOUR_MS * 48);
  const [endAt, setEndAt] = useState(Date.now() + HOUR_MS * 48 + DEFAULT_EVENT_DURATION_MS);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
    [],
  );

  const mapFocus: FocusLocation | undefined = selectedLocation
    ? {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        label: selectedLocation.displayName,
      }
    : undefined;

  const durationMinutes = Math.max(30, Math.round((endAt - startAt) / (1000 * 60)));
  const scheduleLabel = useMemo(() => formatEventWindow(startAt, endAt), [endAt, startAt]);
  const descriptionLength = description.trim().length;
  const descriptionRemaining = Math.max(0, CREATE_EVENT_MIN_DESCRIPTION_CHARS - descriptionLength);

  const resetForm = () => {
    const nextStartAt = Date.now() + HOUR_MS * 48;
    setTitle("");
    setDescription("");
    setCategory(EVENT_CATEGORIES[0]);
    setImpactSummary("");
    setHasCapacityLimit(false);
    setCapacity("");
    setCoverStorageId(null);
    setCoverPreviewUri(null);
    setGalleryUploads([]);
    setLocationQuery("");
    setLocationResults([]);
    setSelectedLocation(null);
    setStartAt(nextStartAt);
    setEndAt(nextStartAt + DEFAULT_EVENT_DURATION_MS);
    setErrorMessage(null);
  };

  const pickImages = async (allowsMultipleSelection: boolean) => {
    if (Platform.OS !== "web") {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error("Media permission is required to select event images.");
      }
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection,
      selectionLimit: allowsMultipleSelection ? 6 : 1,
    });

    if (pickerResult.canceled) {
      return [] as ImagePicker.ImagePickerAsset[];
    }

    return pickerResult.assets;
  };

  const onUploadCoverPhoto = async () => {
    setErrorMessage(null);
    setIsUploadingMedia(true);

    try {
      const [asset] = await pickImages(false);
      if (!asset) {
        return;
      }

      const uploadedStorageId = await uploadAsset(asset);
      setCoverStorageId(uploadedStorageId);
      setCoverPreviewUri(asset.uri);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload cover image");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const onUploadGalleryPhotos = async () => {
    setErrorMessage(null);
    setIsUploadingMedia(true);

    try {
      const assets = await pickImages(true);
      if (assets.length === 0) {
        return;
      }

      const uploaded = await Promise.all(
        assets.map(async (asset) => ({
          storageId: await uploadAsset(asset),
          previewUri: asset.uri,
        })),
      );

      setGalleryUploads((previous) => [...previous, ...uploaded]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload gallery images");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const onRemoveCoverPhoto = () => {
    setCoverStorageId(null);
    setCoverPreviewUri(null);
  };

  const onRemoveGalleryPhoto = (storageId: Id<"_storage">) => {
    setGalleryUploads((previous) =>
      previous.filter((uploadItem) => uploadItem.storageId !== storageId),
    );
  };

  const onLookupAddress = async () => {
    const normalizedQuery = locationQuery.trim();
    if (normalizedQuery.length < 3) {
      setErrorMessage("Enter at least 3 characters to look up an address.");
      return;
    }

    setErrorMessage(null);
    setLocationBusy(true);

    try {
      const results = (await lookupAddress({
        query: normalizedQuery,
        limit: 5,
      })) as GeocodeResult[];

      setLocationResults(results);

      if (results.length === 0) {
        setSelectedLocation(null);
        setErrorMessage("No matching addresses were found.");
        return;
      }

      setSelectedLocation(results[0]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not look up this address");
      setLocationResults([]);
      setSelectedLocation(null);
    } finally {
      setLocationBusy(false);
    }
  };

  const onSelectLocation = (result: GeocodeResult) => {
    setSelectedLocation(result);
    setLocationQuery(result.displayName);
    setLocationResults([]);
    setErrorMessage(null);
  };

  const onCreate = async () => {
    if (!viewerProfileId) {
      return;
    }

    if (!selectedLocation) {
      setErrorMessage("Look up and select an address before publishing.");
      return;
    }

    setErrorMessage(null);

    const resolvedCity =
      selectedLocation.city?.trim() ||
      selectedLocation.region?.trim() ||
      selectedLocation.country.trim();

    const normalizedImpactSummary = impactSummary.trim();
    const normalizedCapacity = capacity.trim();

    let parsedCapacity: number | undefined = undefined;
    if (hasCapacityLimit) {
      if (!normalizedCapacity) {
        setErrorMessage("Set a capacity value or choose no capacity limit.");
        return;
      }

      const maybeCapacity = Number(normalizedCapacity);
      if (!Number.isInteger(maybeCapacity) || maybeCapacity <= 0) {
        setErrorMessage("Capacity must be a whole number greater than 0.");
        return;
      }

      parsedCapacity = maybeCapacity;
    }

    const validationResult = createEventInputSchema.safeParse({
      title,
      description,
      category,
      startAt,
      endAt,
      timezone,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      addressLine1: selectedLocation.addressLine1,
      city: resolvedCity,
      region: selectedLocation.region || undefined,
      country: selectedLocation.country,
      postalCode: selectedLocation.postalCode || undefined,
      impactSummary: normalizedImpactSummary || undefined,
      capacity: parsedCapacity,
    });

    if (!validationResult.success) {
      setErrorMessage(validationResult.error.issues[0]?.message ?? "Invalid event input");
      return;
    }

    setIsSaving(true);

    try {
      const eventId = await createEvent({
        title: validationResult.data.title,
        description: validationResult.data.description,
        category: validationResult.data.category,
        startAt: validationResult.data.startAt,
        endAt: validationResult.data.endAt,
        timezone,
        latitude: validationResult.data.latitude,
        longitude: validationResult.data.longitude,
        addressLine1: validationResult.data.addressLine1,
        city: validationResult.data.city,
        region: validationResult.data.region,
        country: validationResult.data.country,
        postalCode: validationResult.data.postalCode,
        coverStorageId: coverStorageId ?? undefined,
        impactSummary: validationResult.data.impactSummary,
        capacity: validationResult.data.capacity,
        galleryStorageIds:
          galleryUploads.length > 0
            ? galleryUploads.map((uploadItem) => uploadItem.storageId)
            : undefined,
      });

      resetForm();
      router.push(`/events/${eventId}?origin=create`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create event");
    } finally {
      setIsSaving(false);
    }
  };

  const onChangeStartAt = (nextStartAt: number) => {
    const currentDuration = Math.max(MIN_EVENT_DURATION_MS, endAt - startAt);
    setStartAt(nextStartAt);
    if (endAt <= nextStartAt) {
      setEndAt(nextStartAt + currentDuration);
    }
  };

  const onChangeEndAt = (nextEndAt: number) => {
    if (nextEndAt <= startAt) {
      setEndAt(startAt + MIN_EVENT_DURATION_MS);
      return;
    }

    setEndAt(nextEndAt);
  };

  const onApplyDuration = (minutes: number) => {
    setEndAt(startAt + minutes * 60 * 1000);
  };

  const basicsCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Event basics
      </AppText>
      <TextField
        label="Title"
        onChangeText={setTitle}
        placeholder="Neighborhood Cleanup + Picnic"
        value={title}
      />

      <View style={styles.categoryGroup}>
        <AppText variant="caption" color={theme.colors.muted}>
          Category
        </AppText>
        <ScrollView
          contentContainerStyle={styles.categoryScrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {EVENT_CATEGORIES.map((categoryOption) => (
            <Pressable
              accessibilityRole="button"
              key={categoryOption}
              onPress={() => setCategory(categoryOption)}
              style={({ pressed }) => [
                styles.categoryChip,
                categoryOption === category ? styles.categoryChipActive : undefined,
                pressed ? styles.touchPressed : undefined,
              ]}>
              <AppText
                color={categoryOption === category ? theme.colors.primaryText : theme.colors.primary}
                style={styles.categoryChipLabel}
                variant="caption">
                {categoryOption}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <TextField
        label="Description"
        multiline
        onChangeText={setDescription}
        placeholder="What will happen, what to bring, and who should join?"
        value={description}
      />
      <View style={styles.descriptionHintRow}>
        <AppText
          variant="caption"
          color={descriptionRemaining > 0 ? theme.colors.danger : theme.colors.success}>
          {descriptionRemaining > 0
            ? `${descriptionRemaining} more characters needed (${descriptionLength}/${CREATE_EVENT_MIN_DESCRIPTION_CHARS})`
            : `Description length looks good (${descriptionLength}/${CREATE_EVENT_MIN_DESCRIPTION_CHARS})`}
        </AppText>
      </View>
    </Card>
  );

  const scheduleCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Schedule
      </AppText>
      <AppText variant="caption" color={theme.colors.muted}>
        Choose start and end date/time. You can also tap a quick duration.
      </AppText>
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleField}>
          <DateTimeField
            label="Starts"
            minimumDate={Date.now()}
            minuteInterval={5}
            onChange={onChangeStartAt}
            picker="datetime"
            value={startAt}
          />
        </View>
        <View style={styles.scheduleField}>
          <DateTimeField
            label="Ends"
            minimumDate={startAt + MIN_EVENT_DURATION_MS}
            minuteInterval={5}
            onChange={onChangeEndAt}
            picker="datetime"
            value={endAt}
          />
        </View>
      </View>
      <View style={styles.durationGroup}>
        <AppText variant="caption" color={theme.colors.muted}>
          Quick duration
        </AppText>
        <ScrollView
          contentContainerStyle={styles.durationOptions}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {QUICK_DURATION_OPTIONS.map((minutes) => {
            const isActive = durationMinutes === minutes;
            return (
              <Pressable
                accessibilityRole="button"
                key={minutes}
                onPress={() => onApplyDuration(minutes)}
                style={({ pressed }) => [
                  styles.durationChip,
                  isActive ? styles.durationChipActive : undefined,
                  pressed ? styles.touchPressed : undefined,
                ]}>
                <AppText
                  color={isActive ? theme.colors.primaryText : theme.colors.primary}
                  style={styles.durationChipLabel}
                  variant="caption">
                  {minutes < 120 ? `${minutes} min` : `${minutes / 60} hr`}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.scheduleSummary}>
        <Badge label={scheduleLabel} />
        <AppText variant="caption" color={theme.colors.muted}>
          Timezone: {timezone}
        </AppText>
      </View>
    </Card>
  );

  const locationCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Location
      </AppText>
      <TextField
        label="Address or landmark"
        onChangeText={(nextValue) => {
          setLocationQuery(nextValue);
          if (selectedLocation && nextValue.trim() !== selectedLocation.displayName) {
            setSelectedLocation(null);
          }
        }}
        placeholder="1 Ferry Building, San Francisco"
        value={locationQuery}
      />
      <View style={styles.lookupActionRow}>
        <View style={styles.lookupPrimaryAction}>
          <Button
            label="Look Up Address"
            loading={locationBusy}
            onPress={onLookupAddress}
            variant="secondary"
          />
        </View>
        {(locationQuery.length > 0 || selectedLocation) && (
          <Button
            fullWidth={false}
            label="Clear"
            onPress={() => {
              setLocationQuery("");
              setLocationResults([]);
              setSelectedLocation(null);
              setErrorMessage(null);
            }}
            variant="ghost"
          />
        )}
      </View>
      {selectedLocation ? (
        <Badge label={`Selected: ${selectedLocation.displayName}`} tone="success" />
      ) : null}

      {locationResults.length > 0 ? (
        <View style={styles.lookupResultList}>
          {locationResults.map((resultItem) => (
            <Pressable
              accessibilityRole="button"
              key={`${resultItem.latitude}-${resultItem.longitude}`}
              onPress={() => onSelectLocation(resultItem)}
              style={({ pressed }) => [
                styles.lookupResultItem,
                pressed ? styles.touchPressed : undefined,
              ]}>
              <AppText color={theme.colors.heading} variant="caption" style={{ fontWeight: "700" }}>
                {resultItem.addressLine1}
              </AppText>
              <AppText variant="caption" color={theme.colors.body}>
                {resultItem.displayName}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {mapFocus ? (
        <EventMap events={[]} focusLocation={mapFocus} onSelectEvent={() => undefined} />
      ) : (
        <View style={styles.mapHint}>
          <AppText variant="caption" color={theme.colors.muted}>
            Look up an address to preview it on the map.
          </AppText>
        </View>
      )}
    </Card>
  );

  const photosCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Photos
      </AppText>
      <Button
        label={coverStorageId ? "Replace Cover Photo" : "Upload Cover Photo"}
        loading={isUploadingMedia}
        onPress={onUploadCoverPhoto}
        variant="secondary"
      />
      {coverPreviewUri ? (
        <>
          <Image contentFit="cover" source={coverPreviewUri} style={styles.previewImage} />
          <Button label="Remove Cover Photo" onPress={onRemoveCoverPhoto} variant="danger" />
        </>
      ) : null}

      <Button
        label="Upload Gallery Photos"
        loading={isUploadingMedia}
        onPress={onUploadGalleryPhotos}
        variant="secondary"
      />
      {galleryUploads.length > 0 ? (
        <View style={styles.galleryPreviewRow}>
          {galleryUploads.map((uploadItem) => (
            <View key={`${uploadItem.storageId}-${uploadItem.previewUri}`} style={styles.galleryPreviewItem}>
              <Image
                contentFit="cover"
                source={uploadItem.previewUri}
                style={styles.galleryPreviewImage}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemoveGalleryPhoto(uploadItem.storageId)}
                style={({ pressed }) => [
                  styles.galleryRemoveBadge,
                  pressed ? styles.touchPressed : undefined,
                ]}>
                <AppText
                  color={theme.colors.primaryText}
                  style={styles.galleryRemoveBadgeText}
                  variant="caption">
                  Remove
                </AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );

  const optionalDetailsCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Optional details
      </AppText>
      <AppText variant="caption" color={theme.colors.muted}>
        Skip this section if you do not need it.
      </AppText>
      <TextField
        label="Impact summary (optional)"
        onChangeText={setImpactSummary}
        placeholder="Target: package 5,000 meals"
        value={impactSummary}
      />
      <View style={styles.capacitySection}>
        <AppText variant="caption" color={theme.colors.muted}>
          Attendance limit
        </AppText>
        <View style={styles.capacityChips}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setHasCapacityLimit(false);
              setCapacity("");
            }}
            style={({ pressed }) => [
              styles.capacityChip,
              !hasCapacityLimit ? styles.capacityChipActive : undefined,
              pressed ? styles.touchPressed : undefined,
            ]}>
            <AppText
              color={!hasCapacityLimit ? theme.colors.primaryText : theme.colors.primary}
              style={styles.capacityChipLabel}
              variant="caption">
              No limit
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHasCapacityLimit(true)}
            style={({ pressed }) => [
              styles.capacityChip,
              hasCapacityLimit ? styles.capacityChipActive : undefined,
              pressed ? styles.touchPressed : undefined,
            ]}>
            <AppText
              color={hasCapacityLimit ? theme.colors.primaryText : theme.colors.primary}
              style={styles.capacityChipLabel}
              variant="caption">
              Set limit
            </AppText>
          </Pressable>
        </View>
      </View>

      {hasCapacityLimit ? (
        <TextField
          keyboardType="number-pad"
          label="Capacity"
          onChangeText={(nextValue) => setCapacity(nextValue.replace(/[^0-9]/g, ""))}
          placeholder="120"
          value={capacity}
        />
      ) : (
        <AppText variant="caption" color={theme.colors.subtle}>
          Guests can RSVP without a fixed cap.
        </AppText>
      )}
    </Card>
  );

  const publishCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Review & publish
      </AppText>
      <View style={styles.publishBadges}>
        <Badge label={category} />
        <Badge label={selectedLocation ? "Location selected" : "Location needed"} />
      </View>
      <AppText variant="caption" color={theme.colors.muted}>
        {scheduleLabel}
      </AppText>
      <AppText variant="caption" color={theme.colors.muted}>
        {timezone}
      </AppText>

      {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}

      <Button label="Publish Event" loading={isSaving} onPress={onCreate} />
    </Card>
  );

  if (viewerLoading) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Preparing your organizer profile...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText variant="h2" color={theme.colors.heading}>
          Create Event
        </AppText>
        <AppText color={theme.colors.body}>
          Add details, schedule, location, and photos to publish a new event.
        </AppText>
      </View>
      {isWideLayout ? (
        <View style={styles.columns}>
          <View style={styles.primaryColumn}>
            {basicsCard}
            {scheduleCard}
            {locationCard}
          </View>
          <View style={styles.secondaryColumn}>
            {photosCard}
            {optionalDetailsCard}
            {publishCard}
          </View>
        </View>
      ) : (
        <>
          {basicsCard}
          {scheduleCard}
          {locationCard}
          {photosCard}
          {optionalDetailsCard}
          {publishCard}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  headerSection: {
    gap: theme.spacing.xs,
  },
  columns: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  primaryColumn: {
    flex: 1.15,
    gap: theme.spacing.md,
    minWidth: 0,
  },
  secondaryColumn: {
    flex: 1,
    gap: theme.spacing.md,
    minWidth: 0,
  },
  categoryGroup: {
    gap: theme.spacing.xs,
  },
  categoryScrollContent: {
    gap: theme.spacing.xs,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: 44,
    paddingHorizontal: theme.spacing.md,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipLabel: {
    fontWeight: "700",
  },
  descriptionHintRow: {
    alignItems: "flex-start",
  },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  scheduleField: {
    flex: 1,
    minWidth: 240,
  },
  durationGroup: {
    gap: theme.spacing.xs,
  },
  durationOptions: {
    gap: theme.spacing.xs,
  },
  durationChip: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: 88,
    paddingHorizontal: theme.spacing.md,
  },
  durationChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  durationChipLabel: {
    fontWeight: "700",
  },
  scheduleSummary: {
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  previewImage: {
    borderRadius: theme.radius.lg,
    height: 188,
    width: "100%",
  },
  galleryPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  galleryPreviewItem: {
    gap: 6,
  },
  galleryPreviewImage: {
    borderRadius: theme.radius.md,
    height: 76,
    width: 76,
  },
  galleryRemoveBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.coral,
    borderRadius: theme.radius.pill,
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  galleryRemoveBadgeText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.overline,
    fontWeight: "700",
    letterSpacing: 0,
  },
  lookupResultList: {
    gap: theme.spacing.xs,
  },
  lookupActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  lookupPrimaryAction: {
    flex: 1,
  },
  lookupResultItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  touchPressed: {
    opacity: 0.8,
  },
  mapHint: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  capacitySection: {
    gap: theme.spacing.xs,
  },
  capacityChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  capacityChip: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: 88,
    paddingHorizontal: theme.spacing.md,
  },
  capacityChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  capacityChipLabel: {
    fontWeight: "700",
  },
  publishBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
