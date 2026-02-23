import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import type { EventListItem } from "@/src/modules/events/domain/types";
import { formatEventWindow } from "@/src/modules/events/utils/formatters";

type Props = {
  item: EventListItem;
  onOpen: () => void;
  onRsvp?: () => void;
  rsvpBusy?: boolean;
  distanceMiles?: number;
};

function formatDistance(distanceMiles: number) {
  if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi away`;
  }
  return `${Math.round(distanceMiles)} mi away`;
}

export function EventCard({ item, onOpen, onRsvp, rsvpBusy, distanceMiles }: Props) {
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
              disabled={item.viewerRsvp === "going"}
              fullWidth={false}
              label={item.viewerRsvp === "going" ? "Going" : "Join"}
              loading={rsvpBusy}
              onPress={onRsvp}
            />
          </View>
        ) : null}
      </View>
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
});
