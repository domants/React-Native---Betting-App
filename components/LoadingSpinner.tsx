import React from "react";
import { View, ActivityIndicator } from "react-native";
import { styled } from "nativewind";
import { ThemedText } from "./ThemedText";

const StyledView = styled(View);

export function LoadingSpinner() {
  return (
    <StyledView className="flex-1 justify-center items-center bg-[#FDFDFD]">
      <ActivityIndicator size="large" color="#6F13F5" />
      <ThemedText className="mt-4">Loading...</ThemedText>
    </StyledView>
  );
}
