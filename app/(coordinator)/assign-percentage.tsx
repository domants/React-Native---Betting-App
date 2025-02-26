import { View, TouchableOpacity, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import Modal from "react-native-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface UserAllocation {
  id: string;
  name: string;
  role: string;
  percentage_l2: number;
  percentage_l3: number;
  winnings_l2: number;
  winnings_l3: number;
}

interface UserData {
  name: string;
  role: string;
}

interface SubordinateResponse {
  id: string;
  user_id: string;
  l2_percentage: number;
  l2_amount: number;
  d3_percentage: number;
  d3_amount: number;
  users: {
    name: string;
    role: string;
  };
}

interface SubordinateData {
  id: string;
  user_id: string;
  l2_percentage: number;
  l2_amount: number;
  d3_percentage: number;
  d3_amount: number;
  users: UserData;
}

export default function AssignPercentageScreen() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAllocation | null>(null);
  const [l2Percentage, setL2Percentage] = useState("");
  const [l2Winnings, setL2Winnings] = useState("");
  const [d3Percentage, setD3Percentage] = useState("");
  const [d3Winnings, setD3Winnings] = useState("");

  // Fetch current user's and subordinates' allocations
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["userAllocations"],
    queryFn: async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get current user's data with their allocations
      const { data: currentUserData, error: userError } = await supabase
        .from("users")
        .select("*, parent:parent_id(name)") // Also get parent info
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Get subordinates data - users where parent_id matches current user's id
      const { data: subordinates, error: subError } = await supabase
        .from("users")
        .select(
          `
          id,
          name,
          role,
          parent_id,
          percentage_l2,
          percentage_l3,
          winnings_l2,
          winnings_l3
        `
        )
        .eq("parent_id", user.id) // This is the key change - filter by parent_id
        .order("created_at", { ascending: false });

      if (subError) throw subError;

      return {
        currentUser: currentUserData,
        subordinates: subordinates.map((sub) => ({
          id: sub.id,
          name: sub.name,
          role: sub.role,
          percentage_l2: sub.percentage_l2,
          percentage_l3: sub.percentage_l3,
          winnings_l2: sub.winnings_l2,
          winnings_l3: sub.winnings_l3,
        })),
      };
    },
  });

  // Update calculations to use new field names
  const currentAllocation = {
    l2: {
      percentage:
        userData?.subordinates.reduce(
          (sum, user) => sum + (user.percentage_l2 || 0),
          0
        ) || 0,
      remainingPercentage:
        (userData?.currentUser.percentage_l2 || 0) -
        (userData?.subordinates.reduce(
          (sum, user) => sum + (user.percentage_l2 || 0),
          0
        ) || 0),
      winnings:
        userData?.subordinates.reduce(
          (sum, user) => sum + (user.winnings_l2 || 0),
          0
        ) || 0,
      remainingWinnings:
        (userData?.currentUser.winnings_l2 || 0) -
        (userData?.subordinates.reduce(
          (sum, user) => sum + (user.winnings_l2 || 0),
          0
        ) || 0),
    },
    d3: {
      percentage:
        userData?.subordinates.reduce(
          (sum, user) => sum + (user.percentage_l3 || 0),
          0
        ) || 0,
      remainingPercentage:
        (userData?.currentUser.percentage_l3 || 0) -
        (userData?.subordinates.reduce(
          (sum, user) => sum + (user.percentage_l3 || 0),
          0
        ) || 0),
      winnings:
        userData?.subordinates.reduce(
          (sum, user) => sum + (user.winnings_l3 || 0),
          0
        ) || 0,
      remainingWinnings:
        (userData?.currentUser.winnings_l3 || 0) -
        (userData?.subordinates.reduce(
          (sum, user) => sum + (user.winnings_l3 || 0),
          0
        ) || 0),
    },
  };

  const handleEdit = (user: UserAllocation) => {
    setSelectedUser(user);
    setL2Percentage(user.percentage_l2.toString());
    setL2Winnings(user.winnings_l2.toString());
    setD3Percentage(user.percentage_l3.toString());
    setD3Winnings(user.winnings_l3.toString());
    setIsModalVisible(true);
  };

  // Add validation helper function
  const validateAllocations = (
    newL2Percentage: number,
    newL2Winnings: number,
    newD3Percentage: number,
    newD3Winnings: number
  ) => {
    if (!userData?.currentUser)
      return { isValid: false, message: "No user data available" };

    // Calculate available amounts (current user's allocation minus all other subordinates except selected user)
    const otherSubordinates = userData.subordinates.filter(
      (sub) => sub.id !== selectedUser?.id
    );

    const availableL2Percentage =
      userData.currentUser.percentage_l2 -
      otherSubordinates.reduce((sum, sub) => sum + (sub.percentage_l2 || 0), 0);
    const availableL2Winnings =
      userData.currentUser.winnings_l2 -
      otherSubordinates.reduce((sum, sub) => sum + (sub.winnings_l2 || 0), 0);
    const availableD3Percentage =
      userData.currentUser.percentage_l3 -
      otherSubordinates.reduce((sum, sub) => sum + (sub.percentage_l3 || 0), 0);
    const availableD3Winnings =
      userData.currentUser.winnings_l3 -
      otherSubordinates.reduce((sum, sub) => sum + (sub.winnings_l3 || 0), 0);

    if (newL2Percentage > availableL2Percentage) {
      return {
        isValid: false,
        message: `L2 percentage cannot exceed  the remaining ${availableL2Percentage}% allocation`,
      };
    }

    if (newL2Winnings > availableL2Winnings) {
      return {
        isValid: false,
        message: `L2 winnings cannot exceed the remaining ₱${availableL2Winnings} allocation`,
      };
    }

    if (newD3Percentage > availableD3Percentage) {
      return {
        isValid: false,
        message: `3D percentage cannot exceed the remaining ${availableD3Percentage}% allocation`,
      };
    }

    if (newD3Winnings > availableD3Winnings) {
      return {
        isValid: false,
        message: `3D winnings cannot exceed the remaining ₱${availableD3Winnings} allocation`,
      };
    }

    return { isValid: true, message: "" };
  };

  // Update the mutation
  const updateAllocationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("No user selected");

      // Validate the new allocations
      const validation = validateAllocations(
        Number(l2Percentage),
        Number(l2Winnings),
        Number(d3Percentage),
        Number(d3Winnings)
      );

      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      const { error } = await supabase
        .from("users")
        .update({
          percentage_l2: Number(l2Percentage),
          winnings_l2: Number(l2Winnings),
          percentage_l3: Number(d3Percentage),
          winnings_l3: Number(d3Winnings),
        })
        .eq("id", selectedUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAllocations"] });
      setIsModalVisible(false);
      setL2Percentage("");
      setL2Winnings("");
      setD3Percentage("");
      setD3Winnings("");
      Alert.alert("Success", "Allocation updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating allocation:", error);
      Alert.alert("Error", error.message || "Failed to update allocation");
    },
  });

  const handleSaveAllocation = () => {
    if (!selectedUser) return;
    updateAllocationMutation.mutate();
  };

  if (isUserLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD] justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </StyledSafeAreaView>
    );
  }

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
                style={{
                  width: `${
                    (currentAllocation.l2.percentage /
                      userData?.currentUser.percentage_l2) *
                    100
                  }%`,
                }}
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
                      userData?.currentUser.winnings_l2) *
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
                style={{
                  width: `${
                    (currentAllocation.d3.percentage /
                      userData?.currentUser.percentage_l3) *
                    100
                  }%`,
                }}
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
                      userData?.currentUser.winnings_l3) *
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

          {userData?.subordinates.map((user) => (
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
                    {user.percentage_l2}% | ₱{user.winnings_l2}
                  </ThemedText>
                </StyledView>
                <StyledView className="flex-1">
                  <ThemedText className="text-gray-600 mb-1">
                    3D Allocation
                  </ThemedText>
                  <ThemedText>
                    {user.percentage_l3}% | ₱{user.winnings_l3}
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
        onBackdropPress={() => {}}
        onBackButtonPress={() => {}}
        useNativeDriver
        style={{ margin: 20 }}
        avoidKeyboard
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
              <ThemedText className="text-base mb-2">L2 Percentage</ThemedText>
              <TextInput
                className="border border-gray-200 rounded-lg p-3 bg-white"
                placeholder="Enter percentage"
                value={l2Percentage}
                onChangeText={setL2Percentage}
                keyboardType="numeric"
                maxLength={3}
              />
              <ThemedText className="text-sm text-gray-500 mt-1">
                L2 Available Percentage:{" "}
                {currentAllocation.l2.remainingPercentage}%
              </ThemedText>
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
              <ThemedText className="text-sm text-gray-500 mt-1">
                L2 Available Winnings: ₱{currentAllocation.l2.remainingWinnings}
              </ThemedText>
            </StyledView>

            {/* 3D Percentage */}
            <StyledView>
              <ThemedText className="text-base mb-2">3D Percentage</ThemedText>
              <TextInput
                className="border border-gray-200 rounded-lg p-3 bg-white"
                placeholder="Enter percentage"
                value={d3Percentage}
                onChangeText={setD3Percentage}
                keyboardType="numeric"
                maxLength={3}
              />
              <ThemedText className="text-sm text-gray-500 mt-1">
                3D Available Percentage:{" "}
                {currentAllocation.d3.remainingPercentage}%
              </ThemedText>
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
              <ThemedText className="text-sm text-gray-500 mt-1">
                3D Available Winnings: ₱{currentAllocation.d3.remainingWinnings}
              </ThemedText>
            </StyledView>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-black py-3 rounded-lg mt-4"
              onPress={handleSaveAllocation}
              disabled={updateAllocationMutation.isPending}
            >
              <ThemedText className="text-white text-center font-semibold">
                {updateAllocationMutation.isPending
                  ? "Saving..."
                  : "Save Allocation"}
              </ThemedText>
            </TouchableOpacity>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledSafeAreaView>
  );
}
