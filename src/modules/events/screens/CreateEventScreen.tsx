import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { createEventInputSchema } from "@/src/modules/events/domain/validation";
import { useFileUpload } from "@/src/modules/events/hooks/useFileUpload";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

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

export function CreateEventScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();

  const createEvent = useMutation(api.events.create);
  const lookupAddress = useAction(api.geocoding.search);
  const { uploadAsset } = useFileUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [impactSummary, setImpactSummary] = useState("");
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

  const [startAt, setStartAt] = useState(Date.now() + 1000 * 60 * 60 * 48);
  const [endAt, setEndAt] = useState(Date.now() + 1000 * 60 * 60 * 51);

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
      impactSummary: impactSummary || undefined,
      capacity: capacity ? Number(capacity) : undefined,
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

      router.push(`/events/${eventId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create event");
    } finally {
      setIsSaving(false);
    }
  };

  const onChangeStartAt = (nextStartAt: number) => {
    setStartAt(nextStartAt);
    if (endAt <= nextStartAt) {
      setEndAt(nextStartAt + 1000 * 60 * 60);
    }
  };

  const onChangeEndAt = (nextEndAt: number) => {
    setEndAt(nextEndAt);
  };

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
      <Card innerStyle={styles.heroInner} style={styles.heroCard}>
        <LinearGradient
          colors={[theme.colors.overlayStart, theme.colors.overlayEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.heroGradient}>
          <AppText variant="overline" color={theme.colors.sky}>
            Host an Event
          </AppText>
          <AppText variant="h1" color={theme.colors.primaryText}>
            Create an event in a few steps
          </AppText>
          <AppText color={theme.colors.sky}>
            Share what it is, when it happens, where it is, then upload photos.
          </AppText>
        </LinearGradient>
      </Card>

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

        <View style={styles.categoryRow}>
          {EVENT_CATEGORIES.map((categoryOption) => (
            <View key={categoryOption} style={styles.categoryItem}>
              <Button
                fullWidth={false}
                label={categoryOption}
                onPress={() => setCategory(categoryOption)}
                variant={categoryOption === category ? "primary" : "secondary"}
              />
            </View>
          ))}
        </View>
        <Badge label={`Selected: ${category}`} />

        <TextField
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="What will happen, what to bring, and who should join?"
          value={description}
        />
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Schedule
        </AppText>
        <View style={styles.scheduleGroup}>
          <AppText variant="caption" color={theme.colors.muted}>
            Date range
          </AppText>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleField}>
              <DateTimeField
                label="Start date"
                minimumDate={Date.now()}
                onChange={onChangeStartAt}
                picker="date"
                value={startAt}
              />
            </View>
            <View style={styles.scheduleField}>
              <DateTimeField
                label="End date"
                minimumDate={startAt}
                onChange={onChangeEndAt}
                picker="date"
                value={endAt}
              />
            </View>
          </View>
        </View>
        <View style={styles.scheduleGroup}>
          <AppText variant="caption" color={theme.colors.muted}>
            Times
          </AppText>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleField}>
              <DateTimeField
                label="Start time"
                minuteInterval={5}
                onChange={onChangeStartAt}
                picker="time"
                value={startAt}
              />
            </View>
            <View style={styles.scheduleField}>
              <DateTimeField
                label="End time"
                minuteInterval={5}
                onChange={onChangeEndAt}
                picker="time"
                value={endAt}
              />
            </View>
          </View>
        </View>
      </Card>

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
        <Button
          label="Look Up Address"
          loading={locationBusy}
          onPress={onLookupAddress}
          variant="secondary"
        />
        {selectedLocation ? (
          <Badge label={`Selected: ${selectedLocation.displayName}`} tone="success" />
        ) : null}

        {locationResults.length > 0 ? (
          <View style={styles.lookupResultList}>
            {locationResults.map((resultItem) => (
              <Pressable
                key={`${resultItem.latitude}-${resultItem.longitude}`}
                onPress={() => onSelectLocation(resultItem)}
                style={styles.lookupResultItem}>
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
          <EventMap
            events={[]}
            focusLocation={mapFocus}
            onSelectEvent={() => undefined}
          />
        ) : (
          <View style={styles.mapHint}>
            <AppText variant="caption" color={theme.colors.muted}>
              Look up an address to preview it on the map.
            </AppText>
          </View>
        )}
      </Card>

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
                  onPress={() => onRemoveGalleryPhoto(uploadItem.storageId)}
                  style={styles.galleryRemoveBadge}>
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

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Optional details
        </AppText>
        <TextField
          label="Impact summary"
          onChangeText={setImpactSummary}
          placeholder="Target: package 5,000 meals"
          value={impactSummary}
        />
        <TextField
          keyboardType="number-pad"
          label="Capacity (optional)"
          onChangeText={setCapacity}
          placeholder="120"
          value={capacity}
        />

        {errorMessage ? <AppText color={theme.colors.danger}>{errorMessage}</AppText> : null}

        <Button label="Publish Event" loading={isSaving} onPress={onCreate} />
      </Card>
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
  heroCard: {
    overflow: "hidden",
    padding: 0,
  },
  heroInner: {
    gap: 0,
    padding: 0,
  },
  heroGradient: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  categoryItem: {
    marginBottom: theme.spacing.xs,
  },
  scheduleGroup: {
    gap: theme.spacing.xs,
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  galleryRemoveBadgeText: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  lookupResultList: {
    gap: theme.spacing.xs,
  },
  lookupResultItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mapHint: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
});
