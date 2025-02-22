import { View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "react-native-modal";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getSubordinates, updateUserAllocation } from "@/lib/api/admin";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function PercentageScreen() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [l2Percentage, setL2Percentage] = useState("");
  const [l2Winnings, setL2Winnings] = useState("");
  const [d3Percentage, setD3Percentage] = useState("");
  const [d3Winnings, setD3Winnings] = useState("");
  const router = useRouter();

  // Fetch subordinates
  const { data: subordinates = [], isLoading } = useQuery({
    queryKey: ["subordinates"],
    queryFn: getSubordinates,
  });

  console.log("Subordinates data:", subordinates);

  // Calculate total allocations
  const totalAllocations = subordinates.reduce(
    (acc, user) => ({
      l2Percentage: acc.l2Percentage + (user.percentage_l2 || 0),
      l2Winnings: acc.l2Winnings + (user.winnings_l2 || 0),
      d3Percentage: acc.d3Percentage + (user.percentage_l3 || 0),
      d3Winnings: acc.d3Winnings + (user.winnings_l3 || 0),
    }),
    { l2Percentage: 0, l2Winnings: 0, d3Percentage: 0, d3Winnings: 0 }
  );

  // Update allocation mutation
  const updateAllocationMutation = useMutation({
    mutationFn: async (params: {
      userId: string;
      updates: {
        percentage_l2?: number;
        percentage_l3?: number;
        winnings_l2?: number;
        winnings_l3?: number;
      };
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Not authenticated");
      }

      const result = await updateUserAllocation(params.userId, params.updates);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subordinates"] });
      setIsModalVisible(false);
      setSelectedUser(null);
      Alert.alert("Success", "Allocation updated successfully");
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      if (error.message === "Not authenticated") {
        // Handle auth error
        Alert.alert("Session Expired", "Please log in again", [
          {
            text: "OK",
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace("/(auth)/login");
            },
          },
        ]);
      } else {
        Alert.alert("Error", error.message);
      }
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setL2Percentage(user.percentage_l2?.toString() || "0");
    setL2Winnings(user.winnings_l2?.toString() || "0");
    setD3Percentage(user.percentage_l3?.toString() || "0");
    setD3Winnings(user.winnings_l3?.toString() || "0");
    setIsModalVisible(true);
  };

  const handleSaveAllocation = async () => {
    if (!selectedUser) return;

    try {
      const updates = {
        percentage_l2: Number(l2Percentage) || 0,
        percentage_l3: Number(d3Percentage) || 0,
        winnings_l2: Number(l2Winnings) || 0,
        winnings_l3: Number(d3Winnings) || 0,
      };

      // Validate total percentage doesn't exceed 100%
      const newL2Total =
        totalAllocations.l2Percentage -
        (selectedUser.percentage_l2 || 0) +
        updates.percentage_l2;
      const newD3Total =
        totalAllocations.d3Percentage -
        (selectedUser.percentage_l3 || 0) +
        updates.percentage_l3;

      if (newL2Total > 100) {
        Alert.alert("Error", "Total L2 percentage cannot exceed 100%");
        return;
      }

      if (newD3Total > 100) {
        Alert.alert("Error", "Total 3D percentage cannot exceed 100%");
        return;
      }

      await updateAllocationMutation.mutateAsync({
        userId: selectedUser.id,
        updates,
      });
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save allocation");
    }
  };

  if (isLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD] justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView className="flex-1">
        <StyledView className="p-4">
          {/* Current Allocation Summary */}
          <StyledView className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <ThemedText className="text-lg font-bold mb-4">
              Current Allocation Summary
            </ThemedText>

            {/* L2 Progress */}
            <StyledView className="mb-4">
              <ThemedText className="text-gray-600 mb-1">
                L2 Allocation
              </ThemedText>
              <StyledView className="h-2 bg-gray-200 rounded-full">
                <StyledView
                  className="h-2 bg-green-600 rounded-full"
                  style={{ width: `${totalAllocations.l2Percentage}%` }}
                />
              </StyledView>
              <ThemedText className="text-sm text-gray-600 mt-1">
                {totalAllocations.l2Percentage}% allocated |{" "}
                {100 - totalAllocations.l2Percentage}% remaining
              </ThemedText>
            </StyledView>

            {/* 3D Progress */}
            <StyledView>
              <ThemedText className="text-gray-600 mb-1">
                3D Allocation
              </ThemedText>
              <StyledView className="h-2 bg-gray-200 rounded-full">
                <StyledView
                  className="h-2 bg-green-600 rounded-full"
                  style={{ width: `${totalAllocations.d3Percentage}%` }}
                />
              </StyledView>
              <ThemedText className="text-sm text-gray-600 mt-1">
                {totalAllocations.d3Percentage}% allocated |{" "}
                {100 - totalAllocations.d3Percentage}% remaining
              </ThemedText>
            </StyledView>
          </StyledView>

          {/* Account Allocations */}
          <StyledView className="mt-4">
            <ThemedText className="text-lg font-bold mb-4">
              Account Allocations
            </ThemedText>

            {/* List of accounts */}
            {subordinates.map((account) => (
              <StyledView
                key={account.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4"
              >
                <StyledView className="flex-row justify-between items-center mb-2">
                  <StyledView>
                    <ThemedText className="font-bold">
                      {account.name}
                    </ThemedText>
                    <ThemedText className="text-gray-600">
                      {account.role}
                    </ThemedText>
                  </StyledView>
                  <TouchableOpacity
                    onPress={() => handleEdit(account)}
                    className="bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <ThemedText>Edit</ThemedText>
                  </TouchableOpacity>
                </StyledView>
                <StyledView className="flex-row justify-between">
                  <ThemedText className="text-gray-600">
                    L2: {account.percentage_l2}%{"\n"}₱{account.winnings_l2}
                  </ThemedText>
                  <ThemedText className="text-gray-600">
                    3D: {account.percentage_l3}%{"\n"}₱{account.winnings_l3}
                  </ThemedText>
                </StyledView>
              </StyledView>
            ))}
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        useNativeDriver
        style={{ margin: 20 }}
        avoidKeyboard
      >
        <StyledView className="bg-white p-4 rounded-lg">
          <ThemedText className="text-xl font-bold mb-4">
            Edit Allocation for {selectedUser?.name}
          </ThemedText>

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
              <ThemedText className="text-base mb-2">3D Percentage</ThemedText>
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

            <TouchableOpacity
              className="bg-black py-3 rounded-lg mt-4"
              onPress={handleSaveAllocation}
              disabled={updateAllocationMutation.isPending}
            >
              <ThemedText className="text-white text-center font-semibold">
                {updateAllocationMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </ThemedText>
            </TouchableOpacity>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledSafeAreaView>
  );
}
