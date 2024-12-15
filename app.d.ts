/// <reference types="nativewind/types" />

declare module "nativewind" {
  import type { ComponentType } from "react";
  import type { ViewProps, TextProps } from "react-native";

  export interface StyledProps {
    className?: string;
  }

  export function styled<T extends ComponentType<any>>(
    component: T
  ): T & ComponentType<StyledProps>;
}

// Extend the base React Native types
declare module "react-native" {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }
}
