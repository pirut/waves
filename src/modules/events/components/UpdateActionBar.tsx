import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";

export type UpdateActionBarItem = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
  count?: number;
};

type Props = {
  items: UpdateActionBarItem[];
  style?: StyleProp<ViewStyle>;
};

function getCountLabel(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export function UpdateActionBar({ items, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const iconColor = item.active ? theme.colors.primaryDeep : theme.colors.muted;

        return (
          <Pressable
            android_ripple={{ color: "rgba(10, 132, 255, 0.12)" }}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: item.active, busy: item.loading, disabled: item.loading }}
            disabled={item.loading}
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.item,
              !isLast ? styles.itemDivider : undefined,
              item.active ? styles.itemActive : undefined,
              pressed ? styles.itemPressed : undefined,
            ]}>
            {item.loading ? (
              <ActivityIndicator color={iconColor} size="small" />
            ) : (
              <Ionicons color={iconColor} name={item.icon} size={20} />
            )}
            {(item.count ?? 0) > 0 ? (
              <View style={styles.countBadge}>
                <AppText color={theme.colors.heading} style={styles.countText} variant="caption">
                  {getCountLabel(item.count ?? 0)}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceGlass,
    borderTopColor: theme.colors.glassBorderStrong,
    borderTopWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize + 2,
    position: "relative",
  },
  itemDivider: {
    borderRightColor: theme.colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  itemActive: {
    backgroundColor: theme.mode === "dark" ? "rgba(10, 132, 255, 0.24)" : "rgba(10, 132, 255, 0.14)",
  },
  itemPressed: {
    opacity: 0.9,
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: theme.mode === "dark" ? "rgba(185, 208, 236, 0.18)" : "rgba(255, 255, 255, 0.82)",
    borderRadius: theme.radius.pill,
    borderColor: theme.colors.glassBorderStrong,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 22,
    paddingHorizontal: 5,
    position: "absolute",
    right: 16,
    top: 8,
  },
  countText: {
    fontSize: theme.typography.overline,
    fontWeight: "700",
    lineHeight: 16,
  },
});
