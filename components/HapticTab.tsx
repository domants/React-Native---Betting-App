import React from "react";
import { TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import * as Haptics from "expo-haptics";

interface HapticTabProps {
  href?: string;
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
}

export function HapticTab({
  href,
  children,
  style,
  onPress,
  onPressIn,
}: HapticTabProps) {
  const handlePressIn = React.useCallback(() => {
    if (process.env.EXPO_OS === "ios") {
      // Add a soft haptic feedback when pressing down on the tabs.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.();
  }, [onPressIn]);

  // Only render Link if href is provided
  if (!href) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <Link href={href} onPress={onPress} style={style}>
      {children}
    </Link>
  );
}
