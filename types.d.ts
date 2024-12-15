/// <reference types="nativewind/types" />

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";

declare module "react-native" {
  import type { ColorValue, ComponentType } from "react-native";

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Image: ComponentType<ImageProps>;
  export const Platform: {
    OS: "ios" | "android" | "web";
    select: <T extends Record<string, any>>(specifics: T) => T[keyof T];
  };
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const Alert: {
    alert: (
      title: string,
      message?: string,
      buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: "default" | "cancel" | "destructive";
      }>,
      options?: {
        cancelable?: boolean;
        onDismiss?: () => void;
      }
    ) => void;
  };

  export interface ViewProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
    onTouchEnd?: () => void;
  }

  export interface TextProps {
    className?: string;
    children?: React.ReactNode;
    style?: any;
  }

  export interface ImageProps {
    className?: string;
    style?: any;
    source: number | { uri: string };
    resizeMode?: "cover" | "contain" | "stretch" | "center" | "repeat";
    alt?: string;
  }

  export type ColorSchemeName = "light" | "dark" | null;
  export function useColorScheme(): ColorSchemeName;

  export interface TextInputProps extends ViewProps {
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    value?: string;
    onChangeText?: (text: string) => void;
  }

  export const TextInput: ComponentType<TextInputProps>;
  export const TouchableOpacity: ComponentType<ViewProps>;

  export interface ModalProps extends ViewProps {
    animationType?: "none" | "slide" | "fade";
    transparent?: boolean;
    visible?: boolean;
    onRequestClose?: () => void;
  }

  export const Modal: ComponentType<ModalProps>;
}
