import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/core/theme/tokens";

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaEdges?: Edge[];
}>;

const DEFAULT_EDGES: Edge[] = ["left", "right"];

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  safeAreaEdges = DEFAULT_EDGES,
}: Props) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 1024 ? theme.spacing.xxl : width >= 768 ? theme.spacing.xl : theme.spacing.md;
  const maxWidth = width >= 1024 ? 960 : width >= 768 ? 860 : 720;

  const content = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
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
      <LinearGradient
        colors={[
          theme.colors.glowA,
          theme.colors.glowB,
          theme.colors.background,
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
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
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    width: "100%",
  },
});
