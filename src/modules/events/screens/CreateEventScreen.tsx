import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
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
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { EVENT_CATEGORIES } from "@/src/modules/events/domain/types";
import { createEventInputSchema } from "@/src/modules/events/domain/validation";
import { useFileUpload } from "@/src/modules/events/hooks/useFileUpload";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";
import {
  parseDateTimeInput,
  toDateTimeInputValue,
} from "@/src/modules/events/utils/formatters";

export function CreateEventScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();

  const createEvent = useMutation(api.events.create);
  const { uploadAsset } = useFileUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [impactSummary, setImpactSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryCsv, setGalleryCsv] = useState("");
  const [coverStorageId, setCoverStorageId] = useState<Id<"_storage"> | null>(null);
  const [coverPreviewUri, setCoverPreviewUri] = useState<string | null>(null);
  const [galleryUploads, setGalleryUploads] = useState<
    Array<{ storageId: Id<"_storage">; previewUri: string }>
  >([]);

  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("San Francisco");
  const [region, setRegion] = useState("CA");
  const [country, setCountry] = useState("USA");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("37.7749");
  const [longitude, setLongitude] = useState("-122.4194");
  const [capacity, setCapacity] = useState("");

  const [startAtInput, setStartAtInput] = useState(
    toDateTimeInputValue(Date.now() + 1000 * 60 * 60 * 48),
  );
  const [endAtInput, setEndAtInput] = useState(
    toDateTimeInputValue(Date.now() + 1000 * 60 * 60 * 51),
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
    [],
  );

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
      setCoverImageUrl("");
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
      setGalleryCsv("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload gallery images");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const onCreate = async () => {
    if (!viewerProfileId) {
      return;
    }

    setErrorMessage(null);

    const parsedStartAt = parseDateTimeInput(startAtInput);
    const parsedEndAt = parseDateTimeInput(endAtInput);

    const galleryImageUrls = galleryCsv
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const validationResult = createEventInputSchema.safeParse({
      title,
      description,
      category,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
      timezone,
      latitude: Number(latitude),
      longitude: Number(longitude),
      addressLine1,
      city,
      region: region || undefined,
      country,
      postalCode: postalCode || undefined,
      coverImageUrl: coverImageUrl || undefined,
      impactSummary: impactSummary || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      galleryImageUrls: galleryImageUrls.length > 0 ? galleryImageUrls : undefined,
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
        coverImageUrl: coverStorageId ? undefined : validationResult.data.coverImageUrl,
        coverStorageId: coverStorageId ?? undefined,
        impactSummary: validationResult.data.impactSummary,
        capacity: validationResult.data.capacity,
        galleryStorageIds:
          galleryUploads.length > 0 ? galleryUploads.map((uploadItem) => uploadItem.storageId) : undefined,
        galleryImageUrls: validationResult.data.galleryImageUrls,
      });

      router.push(`/events/${eventId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create event");
    } finally {
      setIsSaving(false);
    }
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
      <Card style={styles.heroCard}>
        <LinearGradient
          colors={[theme.colors.overlayStart, theme.colors.overlayEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.heroGradient}>
          <AppText variant="overline" color={theme.colors.sky}>
            Host an Event
          </AppText>
          <AppText variant="h1" color={theme.colors.primaryText}>
            Create something people want to show up for
          </AppText>
          <AppText color="#d3ebff">
            Use clear details, impact goals, and visuals. The better your event page, the higher your RSVP conversion.
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
        <TextField
          label="Impact summary"
          onChangeText={setImpactSummary}
          placeholder="Target: package 5,000 meals"
          value={impactSummary}
        />
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Visuals
        </AppText>
        <TextField
          label="Cover image URL"
          onChangeText={setCoverImageUrl}
          placeholder="https://..."
          value={coverImageUrl}
        />
        <Button
          label={coverStorageId ? "Replace Uploaded Cover Photo" : "Upload Cover Photo"}
          loading={isUploadingMedia}
          onPress={onUploadCoverPhoto}
          variant="secondary"
        />
        {coverPreviewUri ? (
          <Image contentFit="cover" source={coverPreviewUri} style={styles.previewImage} />
        ) : null}

        <TextField
          label="Gallery image URLs (comma-separated)"
          onChangeText={setGalleryCsv}
          placeholder="https://img1, https://img2"
          value={galleryCsv}
        />
        <Button
          label="Upload Gallery Photos"
          loading={isUploadingMedia}
          onPress={onUploadGalleryPhotos}
          variant="secondary"
        />
        {galleryUploads.length > 0 ? (
          <View style={styles.galleryPreviewRow}>
            {galleryUploads.map((uploadItem) => (
              <Image
                contentFit="cover"
                key={`${uploadItem.storageId}-${uploadItem.previewUri}`}
                source={uploadItem.previewUri}
                style={styles.galleryPreviewImage}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Schedule
        </AppText>
        <TextField
          label="Start (YYYY-MM-DD HH:mm)"
          onChangeText={setStartAtInput}
          placeholder="2026-03-15 09:00"
          value={startAtInput}
        />
        <TextField
          label="End (YYYY-MM-DD HH:mm)"
          onChangeText={setEndAtInput}
          placeholder="2026-03-15 12:00"
          value={endAtInput}
        />
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Location
        </AppText>
        <TextField
          label="Address"
          onChangeText={setAddressLine1}
          placeholder="123 Beach St"
          value={addressLine1}
        />
        <TextField label="City" onChangeText={setCity} placeholder="San Francisco" value={city} />
        <TextField label="Region/State" onChangeText={setRegion} placeholder="CA" value={region} />
        <TextField label="Country" onChangeText={setCountry} placeholder="USA" value={country} />
        <TextField
          label="Postal code"
          onChangeText={setPostalCode}
          placeholder="94121"
          value={postalCode}
        />
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Capacity and coordinates
        </AppText>
        <TextField
          keyboardType="decimal-pad"
          label="Latitude"
          onChangeText={setLatitude}
          placeholder="37.7749"
          value={latitude}
        />
        <TextField
          keyboardType="decimal-pad"
          label="Longitude"
          onChangeText={setLongitude}
          placeholder="-122.4194"
          value={longitude}
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
  galleryPreviewImage: {
    borderRadius: theme.radius.md,
    height: 76,
    width: 76,
  },
});
