import { View, ViewProps } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

export interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  children?: React.ReactNode;
}

export function ThemedView(props: ThemedViewProps) {
  const { style, lightColor, darkColor, children, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps}>
      {children}
    </View>
  );
}
