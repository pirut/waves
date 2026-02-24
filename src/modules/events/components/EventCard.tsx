import { useEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import {
  RSVP_STATUS_OPTIONS,
  getRsvpStatusLabel,
  getRsvpStatusTone,
  type EventListItem,
  type RSVPStatus,
} from "@/src/modules/events/domain/types";
import { formatEventWindow } from "@/src/modules/events/utils/formatters";

type Props = {
  item: EventListItem;
  onOpen: () => void;
  onRsvp?: (status: RSVPStatus) => void | Promise<void>;
  rsvpBusy?: boolean;
  distanceMiles?: number;
};

const RSVP_PANEL_HEIGHT = 228;

function getToneColor(status: RSVPStatus) {
  const tone = getRsvpStatusTone(status);

  if (tone === "success") {
    return theme.colors.success;
  }

  if (tone === "warning") {
    return theme.colors.warning;
  }

  return theme.colors.subtle;
}

function formatDistance(distanceMiles: number) {
  if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi away`;
  }
  return `${Math.round(distanceMiles)} mi away`;
}

export function EventCard({ item, onOpen, onRsvp, rsvpBusy, distanceMiles }: Props) {
  const [rsvpMenuOpen, setRsvpMenuOpen] = useState(false);
  const rsvpMenuProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rsvpMenuProgress, {
      toValue: rsvpMenuOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [rsvpMenuOpen, rsvpMenuProgress]);

  useEffect(() => {
    if (rsvpBusy) {
      setRsvpMenuOpen(false);
    }
  }, [rsvpBusy]);

  const onSelectRsvp = (status: RSVPStatus) => {
    if (!onRsvp || rsvpBusy) {
      return;
    }

    setRsvpMenuOpen(false);
    if (item.viewerRsvp === status) {
      return;
    }

    void onRsvp(status);
  };

  const menuMaxHeight = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RSVP_PANEL_HEIGHT],
  });

  const menuOpacity = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  return (
    <Card style={styles.card}>
      {item.coverImageUrl ? (
        <View style={styles.coverShell}>
          <Image contentFit="cover" source={item.coverImageUrl} style={styles.cover} />
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Badge label={item.category} />
        <Badge label={`${item.attendeeCount} going`} tone="success" />
      </View>

      <AppText variant="h3" color={theme.colors.heading}>
        {item.title}
      </AppText>
      <AppText variant="caption" color={theme.colors.primary}>
        {formatEventWindow(item.startAt, item.endAt)}
      </AppText>
      <AppText variant="caption" color={theme.colors.body}>
        {item.city}, {item.country}
      </AppText>
      {distanceMiles !== undefined ? (
        <AppText variant="caption" color={theme.colors.muted}>
          {formatDistance(distanceMiles)}
        </AppText>
      ) : null}

      {item.impactSummary ? <AppText numberOfLines={3}>{item.impactSummary}</AppText> : null}

      <View style={styles.actionRow}>
        <View style={onRsvp ? styles.actionButton : styles.singleActionButton}>
          <Button fullWidth={false} label="Details" onPress={onOpen} variant="secondary" />
        </View>
        {onRsvp ? (
          <View style={styles.actionButton}>
            <Button
              disabled={!!rsvpBusy}
              fullWidth={false}
              label={`${item.viewerRsvp ? getRsvpStatusLabel(item.viewerRsvp) : "RSVP"} ▾`}
              loading={rsvpBusy}
              onPress={() => setRsvpMenuOpen((value) => !value)}
            />
          </View>
        ) : null}
      </View>

      {onRsvp ? (
        <Animated.View
          pointerEvents={rsvpMenuOpen ? "auto" : "none"}
          style={[
            styles.rsvpMenuShell,
            {
              maxHeight: menuMaxHeight,
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }],
            },
          ]}>
          <View style={styles.rsvpMenu}>
            {RSVP_STATUS_OPTIONS.map((option) => {
              const active = item.viewerRsvp === option.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelectRsvp(option.value)}
                  style={({ pressed }) => [
                    styles.rsvpOption,
                    active ? styles.rsvpOptionActive : undefined,
                    pressed ? styles.rsvpOptionPressed : undefined,
                  ]}>
                  <View style={styles.rsvpOptionText}>
                    <View style={styles.rsvpOptionTitleRow}>
                      <View
                        style={[
                          styles.rsvpOptionDot,
                          { backgroundColor: getToneColor(option.value) },
                        ]}
                      />
                      <AppText
                        color={active ? theme.colors.primaryDeep : theme.colors.heading}
                        variant="caption"
                        style={styles.rsvpOptionTitle}>
                        {option.label}
                      </AppText>
                    </View>
                    <AppText
                      color={active ? theme.colors.primaryDeep : theme.colors.muted}
                      variant="caption">
                      {option.helper}
                    </AppText>
                  </View>
                  {active ? (
                    <MaterialIcons
                      color={theme.colors.primary}
                      name="check-circle"
                      size={18}
                    />
                  ) : (
                    <MaterialIcons color={theme.colors.subtle} name="radio-button-unchecked" size={18} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  coverShell: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  cover: {
    height: 188,
    width: "100%",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  singleActionButton: {
    flex: 1,
  },
  rsvpMenuShell: {
    overflow: "hidden",
  },
  rsvpMenu: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    padding: 6,
  },
  rsvpOption: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  rsvpOptionActive: {
    backgroundColor: theme.colors.sky,
    borderColor: theme.colors.primary,
  },
  rsvpOptionPressed: {
    opacity: 0.82,
  },
  rsvpOptionText: {
    flex: 1,
    gap: 2,
  },
  rsvpOptionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  rsvpOptionDot: {
    borderRadius: theme.radius.pill,
    height: 8,
    width: 8,
  },
  rsvpOptionTitle: {
    fontWeight: "700",
  },
});
