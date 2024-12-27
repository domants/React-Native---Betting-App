/// <reference types="nativewind/types" />

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";

declare module "react-native" {
  import type { ComponentType } from "react";

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

  export interface TextInputProps extends ViewProps {
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    value?: string;
    onChangeText?: (text: string) => void;
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: any;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const TouchableOpacity: ComponentType<ViewProps>;
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
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  role: string;
  balance: number;
  percentage_l2: number;
  percentage_l3: number;
  winnings_l2: number;
  winnings_l3: number;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}
