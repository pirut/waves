import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/core/theme/tokens";

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentContainerStyle }: Props) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.contentContainer, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.background}>
      <LinearGradient
        colors={[theme.colors.background, "#ebe3d5"]}
        end={{ x: 0.95, y: 0.95 }}
        pointerEvents="none"
        start={{ x: 0.08, y: 0.05 }}
        style={styles.gradientBackdrop}
      />
      <View pointerEvents="none" style={styles.orbitTop} />
      <View pointerEvents="none" style={styles.orbitBottom} />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        {content}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.colors.background,
    flex: 1,
    position: "relative",
  },
  gradientBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  orbitTop: {
    borderColor: "rgba(31, 74, 91, 0.14)",
    borderRadius: 180,
    borderWidth: 1,
    height: 360,
    position: "absolute",
    right: -150,
    top: -210,
    width: 360,
  },
  orbitBottom: {
    borderColor: "rgba(184, 134, 70, 0.16)",
    borderRadius: 220,
    borderWidth: 1,
    bottom: -240,
    height: 420,
    left: -170,
    position: "absolute",
    width: 420,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    alignSelf: "center",
    flexGrow: 1,
    gap: theme.spacing.lg,
    maxWidth: 1180,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl + theme.spacing.xl,
    width: "100%",
  },
});
