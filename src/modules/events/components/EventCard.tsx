import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
};

export function EventCard({ item, onOpen, onRsvp, rsvpBusy }: Props) {
  return (
    <Card style={styles.card}>
      {item.coverImageUrl ? (
        <View style={styles.coverShell}>
          <Image contentFit="cover" source={item.coverImageUrl} style={styles.cover} />
          <LinearGradient
            colors={["rgba(8,20,33,0)", "rgba(8,20,33,0.52)"]}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={styles.coverOverlay}
          />
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Badge label={item.category} />
        <Badge label={`${item.attendeeCount} going`} tone="success" />
      </View>

      <AppText variant="h2" color={theme.colors.heading}>
        {item.title}
      </AppText>
      <AppText variant="caption" color={theme.colors.primary}>
        {formatEventWindow(item.startAt, item.endAt)}
      </AppText>
      <AppText variant="caption" color={theme.colors.body}>
        {item.city}, {item.country}
      </AppText>

      {item.impactSummary ? <AppText numberOfLines={3}>{item.impactSummary}</AppText> : null}

      <View style={styles.actionRow}>
        <View style={styles.actionButton}>
          <Button fullWidth={false} label="Details" onPress={onOpen} variant="secondary" />
        </View>
        {onRsvp ? (
          <View style={styles.actionButton}>
            <Button
              disabled={item.viewerRsvp === "going"}
              fullWidth={false}
              label={item.viewerRsvp === "going" ? "You're Going" : "Join"}
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
    gap: theme.spacing.md,
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
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
