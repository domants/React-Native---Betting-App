import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { UserRoleHeader } from "@/components/UserRoleHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface ManagementOption {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route:
    | "/(auth)/register"
    | "/(admin)/percentage"
    | "/(admin)/results"
    | "/(admin)/daily-bets"
    | "/(admin)/history"
    | "/(admin)/limits";
}

interface ManagementCardProps {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}

function ManagementCard({
  title,
  description,
  icon,
  onPress,
}: ManagementCardProps) {
  return (
    <TouchableOpacity
      className="w-full p-4 mb-3 bg-white rounded-xl border border-gray-200"
      onPress={onPress}
    >
      <StyledView className="flex-row items-center mb-1">
        <MaterialIcons name={icon} size={24} color="#6F13F5" />
        <ThemedText className="ml-3 text-lg font-semibold">{title}</ThemedText>
      </StyledView>
      <ThemedText className="text-gray-600 ml-9">{description}</ThemedText>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const { user } = useCurrentUser();

  if (!user) {
    return null;
  }

  const managementOptions: ManagementOption[] = [
    {
      title: "Account Registration",
      description: "Register new accounts",
      icon: "person-add",
      route: "/(auth)/register",
    },
    {
      title: "Percentage & Winnings",
      description: "Manage percentage & winnings",
      icon: "percent",
      route: "/(admin)/percentage",
    },
    {
      title: "Draw Results",
      description: "Manage draw results",
      icon: "emoji-events",
      route: "/(admin)/results",
    },
    {
      title: "Daily Bets",
      description: "View and manage daily bets",
      icon: "today",
      route: "/(admin)/daily-bets",
    },
    {
      title: "Bet History",
      description: "View betting history",
      icon: "history",
      route: "/(admin)/history",
    },
    {
      title: "Bet Limits",
      description: "Set betting limits",
      icon: "block",
      route: "/(admin)/limits",
    },
  ] as const;

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <UserRoleHeader username={user.username} role={user.role} />
      <StyledView className="flex-1 px-4 pt-2">
        <ThemedText className="text-2xl font-bold mb-4 text-[#6F13F5]">
          Betting Management
        </ThemedText>

        <StyledView className="flex-1">
          {managementOptions.map((option) => (
            <ManagementCard
              key={option.title}
              title={option.title}
              description={option.description}
              icon={option.icon}
              onPress={() => router.push(option.route)}
            />
          ))}
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
