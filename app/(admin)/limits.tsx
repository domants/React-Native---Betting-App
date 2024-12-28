import { View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function LimitsScreen() {
  const [last2Limit, setLast2Limit] = useState("");
  const [d3Limit, setD3Limit] = useState("");

  const handleSetLimits = () => {
    console.log("Setting limits...", {
      last2Limit,
      d3Limit,
    });
    // Add your save logic here
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">Set Bet Limits</ThemedText>
        </StyledView>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-base mb-2">Last 2 Bet Limit</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter limit for L2"
              value={last2Limit}
              onChangeText={setLast2Limit}
              keyboardType="numeric"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">3D Bet Limit</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter limit for 3D"
              value={d3Limit}
              onChangeText={setD3Limit}
              keyboardType="numeric"
            />
          </StyledView>

          <TouchableOpacity
            className="mt-auto bg-black p-4 rounded-lg"
            onPress={handleSetLimits}
          >
            <ThemedText className="text-white text-center font-semibold text-base">
              Set Limits
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
