import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface ManagementOption {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: `/${string}` | "/(auth)/register" | "/(tabs)/dashboard";
}

function ManagementCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
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

export default function ManagementScreen() {
  const { user, isLoading: isUserLoading } = useCurrentUser();

  const managementOptions: ManagementOption[] = [
    {
      title: "Create Account",
      description: "Create sub coor and usher accounts",
      icon: "person-add",
      route: "/(auth)/register",
    },
    {
      title: "Assign Percentage",
      description: "Set percentage & winnings for L2 & 3D",
      icon: "percent",
      route: "/(coordinator)/assign-percentage",
    },
    {
      title: "View Bets",
      description: "View all placed bets",
      icon: "list",
      route: "/(coordinator)/view-bets",
    },
    {
      title: "Place Bet",
      description: "Place new bets for games",
      icon: "add-circle",
      route: "/(tabs)/dashboard",
    },
  ];

  if (isUserLoading || !user) {
    return null; // or a loading spinner
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <StyledView className="p-4">
        <StyledView className="flex-row justify-between items-start mb-2">
          <ThemedText className="text-2xl font-bold text-[#6F13F5]">
            Welcome {user.username}!
          </ThemedText>
          <StyledView className="flex-row items-center">
            <StyledView className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            <ThemedText className="text-sm text-green-500">Online</ThemedText>
          </StyledView>
        </StyledView>
        <ThemedText className="text-sm text-gray-500">{user.role}</ThemedText>
      </StyledView>

      {/* Management Options */}
      <StyledView className="flex-1 px-4">
        <ThemedText className="text-xl font-bold mb-4 text-[#6F13F5]">
          Betting Management
        </ThemedText>

        {managementOptions.map((option) => (
          <ManagementCard
            key={option.title}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onPress={() => router.push(option.route as any)}
          />
        ))}
      </StyledView>
    </StyledSafeAreaView>
  );
}
