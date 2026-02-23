import { StyleSheet } from "react-native";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";

export default function ModalScreen() {
  return (
    <Screen scroll={false}>
      <Card style={styles.shell}>
        <AppText variant="h1" color={theme.colors.heading}>
          Make Waves
        </AppText>
        <AppText color={theme.colors.body}>
          This placeholder modal can be reused for future global workflows.
        </AppText>
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
