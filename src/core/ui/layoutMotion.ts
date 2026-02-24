import { LayoutAnimation, Platform, UIManager } from "react-native";

let androidLayoutAnimationEnabled = false;

function ensureLayoutAnimationEnabled() {
  if (Platform.OS !== "android" || androidLayoutAnimationEnabled) {
    return;
  }

  if (typeof UIManager.setLayoutAnimationEnabledExperimental === "function") {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  androidLayoutAnimationEnabled = true;
}

export function animateLayoutTransition(duration = 180) {
  if (Platform.OS === "web") {
    return;
  }

  ensureLayoutAnimationEnabled();

  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}
