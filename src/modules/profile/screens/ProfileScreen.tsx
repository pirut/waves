import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { clerkPublishableKey } from "@/src/lib/auth/config";
import { localAuthBypassEnabled } from "@/src/lib/auth/devBypass";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

function normalizeHandleInput(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

type ProfileContentProps = {
  showSignOut: boolean;
  onSignOut?: () => void;
};

function ProfileScreenContent({ showSignOut, onSignOut }: ProfileContentProps) {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1024;

  const profile = useQuery(api.viewer.getCurrent, viewerProfileId ? {} : "skip");
  const myEvents = useQuery(api.events.listForViewer, viewerProfileId ? {} : "skip");
  const updateCurrentProfile = useMutation(api.viewer.updateCurrentProfile);

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(profile.displayName);
    setHandle(profile.handle ?? profile.slug);
    setCity(profile.city ?? "");
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile?.displayName) {
      return "MW";
    }

    const parts = profile.displayName.trim().split(/\s+/).slice(0, 2);
    const letters = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean);
    return letters.join("") || "MW";
  }, [profile?.displayName]);

  const onSaveProfile = async () => {
    if (!viewerProfileId) {
      return;
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      setStatusNote("Display name must be at least 2 characters.");
      return;
    }

    const normalizedHandle = normalizeHandleInput(handle);
    if (!HANDLE_PATTERN.test(normalizedHandle)) {
      setStatusNote(
        "Handle must be 3-24 characters using lowercase letters, numbers, underscores, or hyphens.",
      );
      return;
    }

    setIsSaving(true);
    setStatusNote(null);

    try {
      await updateCurrentProfile({
        displayName: trimmedName,
        handle: normalizedHandle,
        city: city.trim() || undefined,
      });
      setStatusNote("Profile updated.");
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (viewerLoading || profile === undefined || myEvents === undefined) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading your profile...</AppText>
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <AppText variant="h2" color={theme.colors.heading}>
            Profile unavailable
          </AppText>
          <AppText>Try refreshing or signing in again.</AppText>
          {showSignOut && onSignOut ? (
            <Button label="Sign Out" onPress={onSignOut} variant="secondary" />
          ) : null}
        </View>
      </Screen>
    );
  }

  const identityCard = (
    <Card>
      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <AppText color={theme.colors.primaryText} variant="h3">
            {initials}
          </AppText>
        </View>
        <View style={styles.identityMeta}>
          <AppText variant="h3" color={theme.colors.heading}>
            {profile.displayName}
          </AppText>
          {profile.email ? (
            <AppText variant="caption" color={theme.colors.muted}>
              {profile.email}
            </AppText>
          ) : null}
          <AppText variant="caption" color={theme.colors.muted}>
            @{profile.handle ?? profile.slug}
          </AppText>
        </View>
      </View>
    </Card>
  );

  const editCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Edit profile
      </AppText>
      <TextField
        autoCapitalize="words"
        autoCorrect={false}
        label="Display name"
        onChangeText={setDisplayName}
        placeholder="Your name"
        value={displayName}
      />
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        label="Handle"
        onChangeText={(nextHandle) => setHandle(normalizeHandleInput(nextHandle))}
        placeholder="@makewaves_member"
        value={handle}
      />
      <TextField
        autoCapitalize="words"
        label="City"
        onChangeText={setCity}
        placeholder="San Francisco"
        value={city}
      />
      {statusNote ? (
        <AppText color={statusNote.toLowerCase().includes("updated") ? theme.colors.success : theme.colors.danger}>
          {statusNote}
        </AppText>
      ) : null}
      <Button label="Save Profile" loading={isSaving} onPress={onSaveProfile} />
    </Card>
  );

  const snapshotCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Impact snapshot
      </AppText>
      <View style={styles.badgesRow}>
        <Badge label={`${myEvents.attending.length} attending`} tone="success" />
        <Badge label={`${myEvents.hosting.length} hosting`} />
      </View>
    </Card>
  );

  const quickActionsCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Quick actions
      </AppText>
      <View style={[styles.actionsRow, isWideLayout ? styles.actionsRowWide : undefined]}>
        <View style={styles.actionItem}>
          <Button label="Discover" onPress={() => router.push("/(tabs)")} variant="secondary" />
        </View>
        <View style={styles.actionItem}>
          <Button label="Create" onPress={() => router.push("/(tabs)/create")} variant="secondary" />
        </View>
        <View style={styles.actionItem}>
          <Button label="My Events" onPress={() => router.push("/(tabs)/my-events")} variant="secondary" />
        </View>
      </View>
    </Card>
  );

  const hostedEventsCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Hosted events
      </AppText>
      {myEvents.hosting.length === 0 ? (
        <AppText>You are not hosting any events yet.</AppText>
      ) : (
        <View style={styles.hostedList}>
          {myEvents.hosting.slice(0, 6).map((eventItem) => (
            <Pressable
              accessibilityRole="button"
              key={eventItem.id}
              onPress={() => router.push(`/events/${eventItem.id}`)}
              style={({ pressed }) => [
                styles.hostedItem,
                pressed ? styles.touchPressed : undefined,
              ]}>
              <AppText color={theme.colors.heading} variant="caption" style={{ fontWeight: "700" }}>
                {eventItem.title}
              </AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {eventItem.city}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );

  const signOutButton =
    showSignOut && onSignOut ? (
      <Button label="Sign Out" onPress={onSignOut} variant="ghost" />
    ) : null;

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText color={theme.colors.body}>
          Manage account details and track your participation.
        </AppText>
      </View>

      {isWideLayout ? (
        <View style={styles.columns}>
          <View style={styles.primaryColumn}>
            {identityCard}
            {editCard}
          </View>
          <View style={styles.secondaryColumn}>
            {snapshotCard}
            {quickActionsCard}
            {hostedEventsCard}
            {signOutButton}
          </View>
        </View>
      ) : (
        <>
          {identityCard}
          {editCard}
          {snapshotCard}
          {quickActionsCard}
          {hostedEventsCard}
          {signOutButton}
        </>
      )}
    </Screen>
  );
}

function ProfileScreenWithAuth() {
  const { signOut } = useAuth();

  return <ProfileScreenContent onSignOut={() => void signOut()} showSignOut />;
}

export function ProfileScreen() {
  if (localAuthBypassEnabled || !clerkPublishableKey) {
    return <ProfileScreenContent showSignOut={false} />;
  }

  return <ProfileScreenWithAuth />;
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
    flex: 1.05,
    gap: theme.spacing.md,
    minWidth: 0,
  },
  secondaryColumn: {
    flex: 1,
    gap: theme.spacing.md,
    minWidth: 0,
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryDeep,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  identityMeta: {
    flex: 1,
    gap: 2,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  actionsRow: {
    gap: theme.spacing.sm,
  },
  actionsRowWide: {
    flexDirection: "row",
  },
  actionItem: {
    flex: 1,
  },
  hostedList: {
    gap: theme.spacing.xs,
  },
  hostedItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 2,
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  touchPressed: {
    opacity: 0.8,
  },
});
