import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Screen } from "@/src/core/ui/Screen";

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.shell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Page not found
        </AppText>
        <AppText>This route doesn\'t exist in Make Waves.</AppText>
        <Link href="/(tabs)" asChild>
          <Button label="Back to app" onPress={() => undefined} />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
});
