import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserRoleHeader } from "@/components/UserRoleHeader";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface AdminOption {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route:
    | "/(auth)/register"
    | "/(admin)/percentage"
    | "/(admin)/results"
    | "/(admin)/daily-bets"
    | "/(admin)/history"
    | "/(admin)/limits"
    | "/(admin)/audit";
}

const adminOptions: AdminOption[] = [
  {
    title: "User Management",
    description: "Create and manage user accounts",
    icon: "people",
    route: "/(auth)/register",
  },
  {
    title: "Percentage Management",
    description: "Set percentage and winnings for users",
    icon: "percent",
    route: "/(admin)/percentage",
  },
  {
    title: "Draw Results",
    description: "Add and manage draw results",
    icon: "add-circle",
    route: "/(admin)/results",
  },
  {
    title: "Daily Bets",
    description: "View all bets for today",
    icon: "today",
    route: "/(admin)/daily-bets",
  },
  {
    title: "Bet History",
    description: "View historical bets and winnings",
    icon: "history",
    route: "/(admin)/history",
  },
  {
    title: "Bet Limits",
    description: "Set betting limits for L2 and 3D",
    icon: "block",
    route: "/(admin)/limits",
  },
  {
    title: "Audit Logs",
    description: "View system activity logs",
    icon: "receipt-long",
    route: "/(admin)/audit",
  },
];

export default function AdminDashboard() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD] justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <UserRoleHeader
        username={user?.username || ""}
        role={user?.role || "Admin"}
      />

      {/* Admin Options */}
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row flex-wrap justify-between">
          {adminOptions.map((option) => (
            <TouchableOpacity
              key={option.title}
              className="w-[48%] bg-white p-4 rounded-xl mb-4 border border-gray-100"
              onPress={() => router.push(option.route as any)}
            >
              <MaterialIcons
                name={option.icon}
                size={24}
                color="#6F13F5"
                style={{ marginBottom: 8 }}
              />
              <ThemedText className="text-lg font-semibold mb-1">
                {option.title}
              </ThemedText>
              <ThemedText className="text-sm text-gray-600">
                {option.description}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
