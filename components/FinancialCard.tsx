import { View } from "react-native";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const StyledView = styled(View);

interface FinancialCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  rightElement?: React.ReactNode;
}

export function FinancialCard({
  title,
  value,
  icon,
  rightElement,
}: FinancialCardProps) {
  return (
    <ThemedView className="w-full p-3 rounded-xl bg-[#F7F5FA] border border-[#5a189a] border-opacity-30">
      <StyledView className="flex-row items-center justify-between mb-2">
        <StyledView className="flex-row items-center flex-1 gap-2">
          <MaterialIcons name={icon} size={24} color="#867F91" />
          <ThemedText className="text-sm text-[#867F91] flex-1 flex-wrap">
            {title}
          </ThemedText>
        </StyledView>
        {rightElement}
      </StyledView>
      <ThemedText className="text-lg font-bold text-[#9654F7]">
        ₱ {value}
      </ThemedText>
    </ThemedView>
  );
}
