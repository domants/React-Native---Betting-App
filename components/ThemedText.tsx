import { Text, TextProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  type?: "link" | "title" | "default" | "defaultSemiBold" | "subtitle";
  children?: React.ReactNode;
}

export function ThemedText(props: ThemedTextProps) {
  const {
    style,
    lightColor,
    darkColor,
    type = "default",
    children,
    ...otherProps
  } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  let textStyle = {};
  switch (type) {
    case "link":
      textStyle = {
        lineHeight: 30,
        fontSize: 16,
        color: "#0a7ea4",
      };
      break;
    case "title":
      textStyle = {
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
      };
      break;
    case "default":
      textStyle = {
        fontSize: 16,
        lineHeight: 24,
      };
      break;
    case "defaultSemiBold":
      textStyle = {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
      };
      break;
    case "subtitle":
      textStyle = {
        fontSize: 20,
        fontWeight: "bold",
      };
      break;
  }

  return (
    <Text style={[{ color }, textStyle, style]} {...otherProps}>
      {children}
    </Text>
  );
}
