import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import { ThemedText } from "@/components/ThemedText";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface Subordinate {
  id: string;
  name: string;
  percentage: number;
  winnings: number;
}

export default function AssignPercentageScreen() {
  const { user } = useCurrentUser();
  const [subordinates, setSubordinates] = useState<Subordinate[]>([
    {
      id: "1",
      name: "John Doe",
      percentage: 30,
      winnings: 3000,
    },
    {
      id: "2",
      name: "Jane Smith",
      percentage: 10,
      winnings: 1000,
    },
  ]);

  // New allocation form state
  const [selectedSubordinate, setSelectedSubordinate] = useState("");
  const [newPercentage, setNewPercentage] = useState("2");
  const [newWinnings, setNewWinnings] = useState("");

  // Calculate available allocation
  const totalAllocatedPercentage = subordinates.reduce(
    (sum, sub) => sum + sub.percentage,
    0
  );
  const totalAllocatedWinnings = subordinates.reduce(
    (sum, sub) => sum + sub.winnings,
    0
  );
  const availablePercentage = 60 - totalAllocatedPercentage;
  const availableWinnings = 6000 - totalAllocatedWinnings;

  const handleEditAllocation = (subordinateId: string) => {
    // Implement edit logic
    console.log("Editing allocation for:", subordinateId);
  };

  const handleConfirmAllocation = () => {
    if (!selectedSubordinate) {
      Alert.alert("Error", "Please select a subordinate");
      return;
    }

    const percentage = Number(newPercentage);
    const winnings = Number(newWinnings);

    if (percentage > availablePercentage) {
      Alert.alert("Error", "Percentage exceeds available allocation");
      return;
    }

    if (winnings > availableWinnings) {
      Alert.alert("Error", "Winnings exceed available allocation");
      return;
    }

    // Add new allocation logic here
    console.log("New allocation:", {
      subordinate: selectedSubordinate,
      percentage,
      winnings,
    });
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView className="flex-1">
        <StyledView className="p-4">
          {/* Header */}
          <StyledView className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <ThemedText className="text-2xl font-bold">
              Assign Percentage & Winnings
            </ThemedText>
          </StyledView>

          {/* Current Allocation Overview */}
          <StyledView className="bg-white p-4 rounded-lg mb-6">
            <ThemedText className="text-xl font-bold mb-4">
              Current Allocation Overview
            </ThemedText>
            <ThemedText className="text-base mb-2">
              Available Percentage: {availablePercentage}%
            </ThemedText>
            <ThemedText className="text-base">
              Available Winnings: ₱{availableWinnings}
            </ThemedText>
          </StyledView>

          {/* Subordinates List */}
          <ThemedText className="text-xl font-bold mb-4">
            Subordinates
          </ThemedText>
          {subordinates.map((subordinate) => (
            <StyledView
              key={subordinate.id}
              className="bg-white p-4 rounded-lg mb-3 flex-row justify-between items-center"
            >
              <StyledView>
                <ThemedText className="font-bold mb-1">
                  {subordinate.name}
                </ThemedText>
                <ThemedText className="text-gray-600">
                  {subordinate.percentage}% | ₱{subordinate.winnings}
                </ThemedText>
              </StyledView>
              <TouchableOpacity
                onPress={() => handleEditAllocation(subordinate.id)}
                className="bg-gray-100 px-4 py-2 rounded-lg"
              >
                <ThemedText>Edit Allocation</ThemedText>
              </TouchableOpacity>
            </StyledView>
          ))}

          {/* Add Allocation Section */}
          <StyledView className="bg-white p-4 rounded-lg mt-4">
            <ThemedText className="text-xl font-bold mb-4">
              Add Allocation
            </ThemedText>

            <StyledView className="mb-4">
              <ThemedText className="mb-2">Select Subordinate</ThemedText>
              <Dropdown
                data={[
                  { label: "Add New Subordinate", value: "new" },
                  { label: "Existing User 1", value: "user1" },
                  { label: "Existing User 2", value: "user2" },
                ]}
                labelField="label"
                valueField="value"
                placeholder="Add New Subordinate"
                value={selectedSubordinate}
                onChange={(item) => setSelectedSubordinate(item.value)}
                style={{
                  height: 50,
                  borderColor: "#E5E7EB",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}
              />
            </StyledView>

            <StyledView className="mb-4">
              <ThemedText className="mb-2">
                Percentage ({newPercentage}%)
              </ThemedText>
              <StyledView className="flex-row items-center">
                <TextInput
                  value={newPercentage}
                  onChangeText={setNewPercentage}
                  keyboardType="numeric"
                  className="flex-1 h-12 px-4 border border-gray-200 rounded-lg"
                  placeholder="Enter percentage"
                />
              </StyledView>
            </StyledView>

            <StyledView className="mb-6">
              <ThemedText className="mb-2">Winnings (₱)</ThemedText>
              <TextInput
                value={newWinnings}
                onChangeText={setNewWinnings}
                keyboardType="numeric"
                className="h-12 px-4 border border-gray-200 rounded-lg"
                placeholder="Enter winnings amount"
              />
            </StyledView>

            <TouchableOpacity
              className="bg-black py-4 rounded-lg"
              onPress={handleConfirmAllocation}
            >
              <ThemedText className="text-white text-center font-semibold">
                Confirm Allocation
              </ThemedText>
            </TouchableOpacity>
          </StyledView>
        </StyledView>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
