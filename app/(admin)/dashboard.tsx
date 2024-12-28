import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  route?: string;
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
      className="w-full p-4 mb-4 bg-white rounded-xl border border-gray-200"
      onPress={onPress}
    >
      <StyledView className="flex-row items-center mb-2">
        <MaterialIcons name={icon} size={24} color="#6F13F5" />
        <ThemedText className="text-lg font-bold ml-2 text-[#6F13F5]">
          {title}
        </ThemedText>
      </StyledView>
      <ThemedText className="text-sm text-gray-600">{description}</ThemedText>
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
      description: "Click to register new account",
      icon: "person-add",
      route: "/(auth)/register",
    },
    {
      title: "Percentage & Winnings",
      description: "Click to manage percentage & winnings",
      icon: "percent",
      route: "/(admin)/percentage",
    },
    {
      title: "Draw Results",
      description: "Click to manage draw results",
      icon: "emoji-events",
      route: "/(admin)/results",
    },
    {
      title: "Daily Bets",
      description: "Click to manage daily bets",
      icon: "today",
      route: "/(admin)/daily-bets",
    },
    {
      title: "Bet History",
      description: "Click to manage bet history",
      icon: "history",
      route: "/(admin)/history",
    },
    {
      title: "Bet Limits",
      description: "Click to manage bet limits",
      icon: "block",
      route: "/(admin)/limits",
    },
  ];

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <UserRoleHeader username={user.username} role={user.role} />

      <StyledView className="flex-1 p-4">
        <ThemedText className="text-2xl font-bold mb-6 text-[#6F13F5]">
          Betting Management
        </ThemedText>

        {managementOptions.map((option) => (
          <ManagementCard
            key={option.title}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onPress={() => router.push(option.route || "")}
          />
        ))}
      </StyledView>
    </StyledSafeAreaView>
  );
}
