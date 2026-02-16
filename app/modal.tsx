import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Screen } from "@/src/core/ui/Screen";

export default function ModalScreen() {
  return (
    <Screen scroll={false}>
      <LinearGradient
        colors={[theme.colors.overlayStart, theme.colors.overlayEnd]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.shell}>
        <AppText variant="h1" color={theme.colors.primaryText}>
          Make Waves
        </AppText>
        <AppText color={theme.colors.sky}>
          This placeholder modal can be reused for future global workflows.
        </AppText>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    borderRadius: theme.radius.xl,
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    width: "100%",
  },
});
