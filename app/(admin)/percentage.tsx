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

export default function PercentageScreen() {
  const [last2Percentage, setLast2Percentage] = useState("");
  const [last2Winnings, setLast2Winnings] = useState("");
  const [d3Percentage, setD3Percentage] = useState("");
  const [d3Winnings, setD3Winnings] = useState("");

  const handleSave = () => {
    console.log("Saving changes...");
    // Add your save logic here
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">
            Assign Percentage & Winnings
          </ThemedText>
        </StyledView>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-base mb-2">
              Last 2 Percentage
            </ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter percentage"
              value={last2Percentage}
              onChangeText={setLast2Percentage}
              keyboardType="numeric"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">Last 2 Winnings</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter winnings"
              value={last2Winnings}
              onChangeText={setLast2Winnings}
              keyboardType="numeric"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">3D Percentage</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter percentage"
              value={d3Percentage}
              onChangeText={setD3Percentage}
              keyboardType="numeric"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">3D Winnings</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter winnings"
              value={d3Winnings}
              onChangeText={setD3Winnings}
              keyboardType="numeric"
            />
          </StyledView>
        </StyledView>

        <TouchableOpacity
          className="mt-auto bg-black p-4 rounded-lg"
          onPress={handleSave}
        >
          <ThemedText className="text-white text-center font-semibold text-base">
            Save Changes
          </ThemedText>
        </TouchableOpacity>
      </StyledView>
    </StyledSafeAreaView>
  );
}
