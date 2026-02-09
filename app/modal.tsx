import { StyleSheet, View } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Screen } from "@/src/core/ui/Screen";

export default function ModalScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.shell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Make Waves
        </AppText>
        <AppText>This placeholder modal can be reused for future global workflows.</AppText>
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
