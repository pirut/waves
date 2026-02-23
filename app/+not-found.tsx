import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <Card style={styles.shell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Page not found
        </AppText>
        <AppText color={theme.colors.body}>This route doesn't exist in Make Waves.</AppText>
        <Link href="/(tabs)" asChild>
          <Button label="Back to app" onPress={() => undefined} />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    alignSelf: "center",
    gap: theme.spacing.md,
    justifyContent: "center",
    maxWidth: 520,
    paddingHorizontal: theme.spacing.md,
    width: "100%",
  },
});
