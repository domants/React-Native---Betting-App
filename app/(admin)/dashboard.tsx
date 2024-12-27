import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  getDailyBets,
  getCurrentUser,
  canCreateCoordinator,
  canManageGameSettings,
  canViewAllBets,
} from "@/lib/supabase";
import type { User } from "@/types";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const { data: dailyBets, isLoading } = useQuery({
    queryKey: ["dailyBets", today],
    queryFn: () => getDailyBets(today),
  });

  // Fetch current user and role
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        router.replace("/(auth)/login");
      }
    }
    fetchUser();
  }, []);

  // Define actions based on user role
  const getAvailableActions = (role: string) => {
    const actions = [];

    if (canCreateCoordinator(role)) {
      actions.push({
        title: "Coordinators",
        icon: "people" as keyof typeof MaterialIcons.glyphMap,
        onPress: () => router.push("/(admin)/coordinators"),
      });
    }

    if (canManageGameSettings(role)) {
      actions.push(
        {
          title: "Game Results",
          icon: "emoji-events" as keyof typeof MaterialIcons.glyphMap,
          onPress: () => router.push("/(admin)/results"),
        },
        {
          title: "Bet Limits",
          icon: "block" as keyof typeof MaterialIcons.glyphMap,
          onPress: () => router.push("/(admin)/limits"),
        }
      );
    }

    if (canViewAllBets(role)) {
      actions.push({
        title: "Reports",
        icon: "assessment" as keyof typeof MaterialIcons.glyphMap,
        onPress: () => router.push("/(admin)/reports"),
      });
    }

    return actions;
  };

  if (!user) return null;

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ThemedView className="p-4 border-b border-gray-200">
        <ThemedText className="text-xl font-bold">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
        </ThemedText>
        <ThemedText className="text-sm text-gray-500 mt-1">
          Role: {user.role}
        </ThemedText>
      </ThemedView>

      <StyledScrollView className="flex-1 p-4">
        <StyledView className="flex-row flex-wrap justify-between mb-6">
          {getAvailableActions(user.role).map((action) => (
            <ThemedView
              key={action.title}
              className="w-[48%] p-4 mb-4 rounded-xl bg-[#F7F5FA] border border-[#5a189a] border-opacity-30"
              onTouchEnd={action.onPress}
            >
              <MaterialIcons name={action.icon} size={32} color="#6F13F5" />
              <ThemedText className="mt-2 font-bold text-[#6F13F5]">
                {action.title}
              </ThemedText>
            </ThemedView>
          ))}
        </StyledView>

        {/* Show bets section only for roles that can view bets */}
        {canViewAllBets(user.role) && (
          <ThemedView className="rounded-xl bg-[#F7F5FA] border border-[#5a189a] border-opacity-30 p-4">
            <ThemedText className="text-lg font-bold mb-4">
              Today's Bets
            </ThemedText>
            {isLoading ? (
              <ThemedText>Loading...</ThemedText>
            ) : (
              dailyBets?.map((bet) => (
                <ThemedView
                  key={bet.id}
                  className="flex-row justify-between items-center mb-2 p-2 border-b border-gray-200"
                >
                  <ThemedText>{bet.users.username}</ThemedText>
                  <ThemedText>₱{bet.total_amount}</ThemedText>
                </ThemedView>
              ))
            )}
          </ThemedView>
        )}
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}
