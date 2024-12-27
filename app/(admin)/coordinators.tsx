import { View, TextInput, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { createCoordinator, getCoordinators } from "@/lib/supabase";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

interface CoordinatorFormData {
  username: string;
  password: string;
  percentageL2: number;
  percentageL3: number;
  winningsL2: number;
  winningsL3: number;
}

export default function CoordinatorsScreen() {
  const queryClient = useQueryClient();
  const { data: coordinators, isLoading } = useQuery({
    queryKey: ["coordinators"],
    queryFn: getCoordinators,
  });

  const createCoordinatorMutation = useMutation({
    mutationFn: createCoordinator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinators"] });
      Alert.alert("Success", "Coordinator account created successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCreateCoordinator = (data: CoordinatorFormData) => {
    createCoordinatorMutation.mutate(data);
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ThemedView className="p-4 border-b border-gray-200">
        <ThemedText className="text-lg font-bold mb-4">
          Create Coordinator
        </ThemedText>
        {/* Form implementation here */}
      </ThemedView>

      <StyledScrollView className="flex-1 p-4">
        <ThemedView className="rounded-xl bg-white border border-gray-200">
          <ThemedText className="text-lg font-bold p-4">
            Coordinator List
          </ThemedText>
          {isLoading ? (
            <ThemedText className="p-4">Loading...</ThemedText>
          ) : (
            coordinators?.map((coordinator) => (
              <ThemedView
                key={coordinator.id}
                className="flex-row justify-between items-center p-4 border-t border-gray-100"
              >
                <ThemedView>
                  <ThemedText className="font-bold">
                    {coordinator.username}
                  </ThemedText>
                  <ThemedText className="text-sm text-gray-500">
                    L2: {coordinator.percentageL2}% | L3:{" "}
                    {coordinator.percentageL3}%
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ThemedView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}
