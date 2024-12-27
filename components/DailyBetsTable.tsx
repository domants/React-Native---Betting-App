import { View } from "react-native";
import { styled } from "nativewind";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const StyledView = styled(View);

interface DailyBet {
  date: string;
  bets: number;
  amount: number;
  winnings: number;
  profit: number;
}

interface DailyBetsTableProps {
  bets: DailyBet[];
}

export function DailyBetsTable({ bets }: DailyBetsTableProps) {
  return (
    <ThemedView className="bg-white rounded-lg p-4">
      <ThemedText className="text-xl font-bold mb-4">Daily Bets</ThemedText>

      {/* Header */}
      <StyledView className="flex-row border-b border-gray-200 pb-2 mb-2">
        <ThemedText className="flex-[2] text-gray-500">Date</ThemedText>
        <ThemedText className="flex-1 text-gray-500 text-center">
          Bets
        </ThemedText>
        <ThemedText className="flex-[1.5] text-gray-500 text-right">
          Amount
        </ThemedText>
        <ThemedText className="flex-[1.5] text-gray-500 text-right">
          Winnings
        </ThemedText>
        <ThemedText className="flex-1 text-gray-500 text-right">
          Profit
        </ThemedText>
      </StyledView>

      {/* Rows */}
      {bets.map((bet, index) => (
        <StyledView
          key={index}
          className="flex-row py-2 border-b border-gray-100"
        >
          <ThemedText className="flex-[2]">{bet.date}</ThemedText>
          <ThemedText className="flex-1 text-center">{bet.bets}</ThemedText>
          <ThemedText className="flex-[1.5] text-right">
            ₱{bet.amount}
          </ThemedText>
          <ThemedText className="flex-[1.5] text-right">
            ₱{bet.winnings}
          </ThemedText>
          <ThemedText
            className={`flex-1 text-right ${
              bet.profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₱{bet.profit}
          </ThemedText>
        </StyledView>
      ))}
    </ThemedView>
  );
}
