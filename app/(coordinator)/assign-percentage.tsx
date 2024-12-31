import { View, TouchableOpacity, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import Modal from "react-native-modal";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface UserAllocation {
  id: string;
  name: string;
  role: string;
  l2Allocation: {
    percentage: number;
    amount: number;
  };
  d3Allocation: {
    percentage: number;
    amount: number;
  };
}

export default function AssignPercentageScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAllocation | null>(null);
  const [l2Percentage, setL2Percentage] = useState("");
  const [l2Winnings, setL2Winnings] = useState("");
  const [d3Percentage, setD3Percentage] = useState("");
  const [d3Winnings, setD3Winnings] = useState("");

  // Mock data - replace with actual data from your backend
  const currentAllocation = {
    l2: {
      percentage: 80,
      remainingPercentage: 20,
      winnings: 7000,
      remainingWinnings: 3000,
    },
    d3: {
      percentage: 55,
      remainingPercentage: 45,
      winnings: 10000,
      remainingWinnings: 10000,
    },
  };

  const users: UserAllocation[] = [
    {
      id: "1",
      name: "John Doe",
      role: "Sub-Coordinator",
      l2Allocation: {
        percentage: 50,
        amount: 2000,
      },
      d3Allocation: {
        percentage: 15,
        amount: 3000,
      },
    },
    {
      id: "2",
      name: "Jane Smith",
      role: "Usher",
      l2Allocation: {
        percentage: 10,
        amount: 1000,
      },
      d3Allocation: {
        percentage: 10,
        amount: 2000,
      },
    },
  ];

  const handleEdit = (user: UserAllocation) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleSaveAllocation = () => {
    setIsModalVisible(false);
    setL2Percentage("");
    setL2Winnings("");
    setD3Percentage("");
    setD3Winnings("");
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <StyledView className="p-4 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText className="text-xl font-bold">
          Assign L2 & 3D Allocation
        </ThemedText>
      </StyledView>

      <ScrollView className="flex-1 p-4">
        {/* Current Allocation Summary */}
        <StyledView className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <ThemedText className="text-lg font-bold mb-4">
            Current Allocation Summary
          </ThemedText>

          {/* L2 Section */}
          <StyledView className="mb-4">
            <ThemedText className="font-bold mb-2">L2</ThemedText>
            <StyledView className="flex-row justify-between mb-2">
              <ThemedText>Percentage:</ThemedText>
              <ThemedText>
                {currentAllocation.l2.remainingPercentage}% remaining
              </ThemedText>
            </StyledView>
            <StyledView className="h-2 bg-gray-200 rounded-full mb-3">
              <StyledView
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${currentAllocation.l2.percentage}%` }}
              />
            </StyledView>
            <StyledView className="flex-row justify-between">
              <ThemedText>Winnings:</ThemedText>
              <ThemedText>
                ₱{currentAllocation.l2.remainingWinnings} remaining
              </ThemedText>
            </StyledView>
            <StyledView className="h-2 bg-gray-200 rounded-full">
              <StyledView
                className="h-2 bg-green-600 rounded-full"
                style={{
                  width: `${
                    (currentAllocation.l2.winnings /
                      (currentAllocation.l2.winnings +
                        currentAllocation.l2.remainingWinnings)) *
                    100
                  }%`,
                }}
              />
            </StyledView>
          </StyledView>

          {/* 3D Section */}
          <StyledView>
            <ThemedText className="font-bold mb-2">3D</ThemedText>
            <StyledView className="flex-row justify-between mb-2">
              <ThemedText>Percentage:</ThemedText>
              <ThemedText>
                {currentAllocation.d3.remainingPercentage}% remaining
              </ThemedText>
            </StyledView>
            <StyledView className="h-2 bg-gray-200 rounded-full mb-3">
              <StyledView
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${currentAllocation.d3.percentage}%` }}
              />
            </StyledView>
            <StyledView className="flex-row justify-between">
              <ThemedText>Winnings:</ThemedText>
              <ThemedText>
                ₱{currentAllocation.d3.remainingWinnings} remaining
              </ThemedText>
            </StyledView>
            <StyledView className="h-2 bg-gray-200 rounded-full">
              <StyledView
                className="h-2 bg-green-600 rounded-full"
                style={{
                  width: `${
                    (currentAllocation.d3.winnings /
                      (currentAllocation.d3.winnings +
                        currentAllocation.d3.remainingWinnings)) *
                    100
                  }%`,
                }}
              />
            </StyledView>
          </StyledView>
        </StyledView>

        {/* User Allocations */}
        <StyledView className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <ThemedText className="text-lg font-bold mb-4">
            User Allocations
          </ThemedText>

          {users.map((user) => (
            <StyledView
              key={user.id}
              className="border-b border-gray-100 py-4 last:border-b-0"
            >
              <StyledView className="flex-row justify-between items-center mb-2">
                <StyledView>
                  <ThemedText className="font-bold">{user.name}</ThemedText>
                  <ThemedText className="text-gray-600">{user.role}</ThemedText>
                </StyledView>
                <TouchableOpacity
                  onPress={() => handleEdit(user)}
                  className="bg-gray-100 px-4 py-2 rounded-lg"
                >
                  <ThemedText>Edit</ThemedText>
                </TouchableOpacity>
              </StyledView>

              <StyledView className="flex-row justify-between">
                <StyledView className="flex-1 mr-4">
                  <ThemedText className="text-gray-600 mb-1">
                    L2 Allocation
                  </ThemedText>
                  <ThemedText>
                    {user.l2Allocation.percentage}% | ₱
                    {user.l2Allocation.amount}
                  </ThemedText>
                </StyledView>
                <StyledView className="flex-1">
                  <ThemedText className="text-gray-600 mb-1">
                    3D Allocation
                  </ThemedText>
                  <ThemedText>
                    {user.d3Allocation.percentage}% | ₱
                    {user.d3Allocation.amount}
                  </ThemedText>
                </StyledView>
              </StyledView>
            </StyledView>
          ))}
        </StyledView>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        onBackButtonPress={() => setIsModalVisible(false)}
        useNativeDriver
        style={{ margin: 20 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <StyledView className="bg-white rounded-xl p-4">
            {/* Modal Header */}
            <StyledView className="flex-row justify-between items-center mb-6">
              <ThemedText className="text-xl font-bold">
                Edit Allocation for {selectedUser?.name}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </StyledView>

            {/* Form Fields */}
            <StyledView className="space-y-4">
              {/* L2 Percentage */}
              <StyledView>
                <ThemedText className="text-base mb-2">
                  L2 Percentage
                </ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                  placeholder="Enter percentage"
                  value={l2Percentage}
                  onChangeText={setL2Percentage}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </StyledView>

              {/* L2 Winnings */}
              <StyledView>
                <ThemedText className="text-base mb-2">L2 Winnings</ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                  placeholder="Enter amount"
                  value={l2Winnings}
                  onChangeText={setL2Winnings}
                  keyboardType="numeric"
                />
              </StyledView>

              {/* 3D Percentage */}
              <StyledView>
                <ThemedText className="text-base mb-2">
                  3D Percentage
                </ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                  placeholder="Enter percentage"
                  value={d3Percentage}
                  onChangeText={setD3Percentage}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </StyledView>

              {/* 3D Winnings */}
              <StyledView>
                <ThemedText className="text-base mb-2">3D Winnings</ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                  placeholder="Enter amount"
                  value={d3Winnings}
                  onChangeText={setD3Winnings}
                  keyboardType="numeric"
                />
              </StyledView>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-black py-3 rounded-lg mt-4"
                onPress={handleSaveAllocation}
              >
                <ThemedText className="text-white text-center font-semibold">
                  Save Allocation
                </ThemedText>
              </TouchableOpacity>
            </StyledView>
          </StyledView>
        </TouchableOpacity>
      </Modal>
    </StyledSafeAreaView>
  );
}
