import React from "react";
import { Text } from "react-native";
import { styled } from "nativewind";

interface ThemedTextProps {
  className?: string;
  children?: React.ReactNode;
  style?: any;
  numberOfLines?: number;
}

const StyledText = styled(Text);

export function ThemedText({
  children,
  className,
  style,
  numberOfLines,
  ...props
}: ThemedTextProps) {
  return (
    <StyledText
      className={className}
      style={style}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </StyledText>
  );
}
