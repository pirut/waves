import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/core/theme/tokens";

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentContainerStyle }: Props) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 1024 ? theme.spacing.xxl : width >= 768 ? theme.spacing.xl : theme.spacing.md;
  const maxWidth = width >= 1024 ? 960 : width >= 768 ? 860 : 720;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        { maxWidth, paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.contentContainer,
        { maxWidth, paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <View style={styles.background}>
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
        {content}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    alignSelf: "center",
    flexGrow: 1,
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    width: "100%",
  },
});
