import { View, TouchableOpacity, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

const roleData = [
  { label: "Admin", value: "admin" },
  { label: "Coordinator", value: "coordinator" },
  { label: "Sub-Coordinator", value: "sub_coordinator" },
];

const accountData = [
  { label: "Coordinator", value: "coordinator" },
  { label: "Sub-Coordinator", value: "sub_coordinator" },
  { label: "Usher", value: "usher" },
];

const gameData = [
  { label: "L2", value: "L2" },
  { label: "3D", value: "3D" },
];

export default function PercentageScreen() {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [percentage, setPercentage] = useState("");
  const [winnings, setWinnings] = useState("");

  const dropdownStyle = {
    height: 50,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "white",
  };

  const placeholderStyle = {
    fontSize: 16,
    color: "#666",
  };

  const selectedTextStyle = {
    fontSize: 16,
    color: "#000",
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView
        onTouchStart={() => {
          // @ts-ignore
          TextInput.State?.blur?.();
        }}
      >
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

          {/* Form Fields */}
          <StyledView className="space-y-4">
            {/* Role Selector */}
            <StyledView>
              <ThemedText className="text-base mb-2">Your Role</ThemedText>
              <Dropdown
                style={dropdownStyle}
                placeholderStyle={placeholderStyle}
                selectedTextStyle={selectedTextStyle}
                data={roleData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select role"
                value={selectedRole}
                onChange={(item) => setSelectedRole(item.value)}
              />
            </StyledView>

            {/* Account Selector */}
            <StyledView>
              <ThemedText className="text-base mb-2">Select Account</ThemedText>
              <Dropdown
                style={dropdownStyle}
                placeholderStyle={placeholderStyle}
                selectedTextStyle={selectedTextStyle}
                data={accountData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select account"
                value={selectedAccount}
                onChange={(item) => setSelectedAccount(item.value)}
              />
            </StyledView>

            {/* Game Type Selector */}
            <StyledView>
              <ThemedText className="text-base mb-2">Game Type</ThemedText>
              <Dropdown
                style={dropdownStyle}
                placeholderStyle={placeholderStyle}
                selectedTextStyle={selectedTextStyle}
                data={gameData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select game"
                value={selectedGame}
                onChange={(item) => setSelectedGame(item.value)}
              />
            </StyledView>

            {/* Percentage Input */}
            <StyledView>
              <ThemedText className="text-base mb-2">
                Percentage (100% available)
              </ThemedText>
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                value={percentage}
                onChangeText={setPercentage}
                keyboardType="numeric"
                placeholder="0"
                blurOnSubmit={true}
              />
            </StyledView>

            {/* Winnings Input */}
            <StyledView>
              <ThemedText className="text-base mb-2">
                Winnings ($10000 available)
              </ThemedText>
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                value={winnings}
                onChangeText={setWinnings}
                keyboardType="numeric"
                placeholder="0"
                blurOnSubmit={true}
              />
            </StyledView>
          </StyledView>

          {/* Save Button */}
          <TouchableOpacity
            className="mt-6 bg-[#6F13F5] p-4 rounded-lg"
            onPress={() => {
              // Add your save logic here
              console.log({
                role: selectedRole,
                account: selectedAccount,
                game: selectedGame,
                percentage,
                winnings,
              });
            }}
          >
            <ThemedText className="text-white text-center font-semibold text-base">
              Assign Allocation
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
