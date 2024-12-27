import { View } from "react-native";
import { styled } from "nativewind";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const StyledView = styled(View);

interface BetSummaryCardProps {
  totalBets: number;
  totalAmount: number;
  winningAmount: number;
  netProfit: number;
}

export function BetSummaryCard({
  totalBets,
  totalAmount,
  winningAmount,
  netProfit,
}: BetSummaryCardProps) {
  return (
    <ThemedView className="bg-white rounded-lg p-4 mb-4">
      <ThemedText className="text-xl font-bold mb-4">Draw Summary</ThemedText>

      <StyledView className="flex-row justify-between mb-4">
        <StyledView>
          <ThemedText className="text-gray-500 mb-1">Total Bets</ThemedText>
          <ThemedText className="text-xl font-bold">{totalBets}</ThemedText>
        </StyledView>

        <StyledView>
          <ThemedText className="text-gray-500 mb-1">Total Amount</ThemedText>
          <ThemedText className="text-xl font-bold">₱{totalAmount}</ThemedText>
        </StyledView>
      </StyledView>

      <StyledView className="flex-row justify-between">
        <StyledView>
          <ThemedText className="text-gray-500 mb-1">Winning Amount</ThemedText>
          <ThemedText className="text-xl font-bold text-green-600">
            ₱{winningAmount}
          </ThemedText>
        </StyledView>

        <StyledView>
          <ThemedText className="text-gray-500 mb-1">Net Profit</ThemedText>
          <ThemedText
            className={`text-xl font-bold ${
              netProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₱{netProfit}
          </ThemedText>
        </StyledView>
      </StyledView>
    </ThemedView>
  );
}
