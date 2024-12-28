import { View } from "react-native";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const StyledView = styled(View);

interface UserRoleHeaderProps {
  username: string;
  role: string;
}

export function UserRoleHeader({ username, role }: UserRoleHeaderProps) {
  return (
    <ThemedView className="p-4 border-b border-gray-200">
      <StyledView className="flex-row justify-between items-center mb-2">
        <ThemedText className="text-xl font-semibold text-[#6F13F5]">
          Welcome {username}!
        </ThemedText>
        <StyledView className="flex-row items-center">
          <MaterialIcons
            name="fiber-manual-record"
            size={12}
            color="#22C55E"
            style={{ marginRight: 4 }}
          />
          <ThemedText className="text-sm text-green-500">Online</ThemedText>
        </StyledView>
      </StyledView>
      <StyledView className="flex-row justify-between items-center">
        <ThemedText className="text-sm text-gray-500">@{username}</ThemedText>
        <ThemedText className="text-sm font-medium text-[#6F13F5]">
          {role}
        </ThemedText>
      </StyledView>
    </ThemedView>
  );
}
