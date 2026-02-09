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
};

export function EventCard({ item, onOpen, onRsvp, rsvpBusy }: Props) {
  return (
    <Card style={styles.card}>
      {item.coverImageUrl ? (
        <Image contentFit="cover" source={item.coverImageUrl} style={styles.cover} />
      ) : null}
      <View style={styles.headerRow}>
        <Badge label={item.category} />
        <Badge label={`${item.attendeeCount} going`} tone="success" />
      </View>

      <AppText variant="h3" color={theme.colors.heading}>
        {item.title}
      </AppText>
      <AppText variant="caption">{formatEventWindow(item.startAt, item.endAt)}</AppText>
      <AppText variant="caption">{item.city}, {item.country}</AppText>

      {item.impactSummary ? <AppText numberOfLines={3}>{item.impactSummary}</AppText> : null}

      <View style={styles.actionRow}>
        <Button fullWidth={false} label="Details" onPress={onOpen} variant="secondary" />
        {onRsvp ? (
          <Button
            disabled={item.viewerRsvp === "going"}
            fullWidth={false}
            label={item.viewerRsvp === "going" ? "You\'re Going" : "Join"}
            loading={rsvpBusy}
            onPress={onRsvp}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  cover: {
    borderRadius: theme.radius.md,
    height: 170,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
});
