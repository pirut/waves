import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Screen } from "@/src/core/ui/Screen";

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <LinearGradient
        colors={[theme.colors.overlayStart, theme.colors.overlayEnd]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.shell}>
        <AppText variant="h1" color={theme.colors.primaryText}>
          Page not found
        </AppText>
        <AppText color={theme.colors.sky}>This route doesn't exist in Make Waves.</AppText>
        <Link href="/(tabs)" asChild>
          <Button label="Back to app" onPress={() => undefined} />
        </Link>
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
