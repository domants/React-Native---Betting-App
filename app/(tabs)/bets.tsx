import { View } from "react-native";
import {
  ScrollView,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { UserRoleHeader } from "@/components/UserRoleHeader";
import { BetSummaryCard } from "@/components/BetSummaryCard";
import { DailyBetsTable } from "@/components/DailyBetsTable";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function BetsScreen() {
  const { user, isLoading: isUserLoading } = useCurrentUser();

  // Example data - replace with your actual data fetching logic
  const summary = {
    totalBets: 150,
    totalAmount: 1500,
    winningAmount: 2000,
    netProfit: 500,
  };

  const dailyBets = [
    {
      date: "2023-05-01",
      bets: 50,
      amount: 500,
      winnings: 750,
      profit: 250,
    },
    {
      date: "2023-05-02",
      bets: 45,
      amount: 450,
      winnings: 600,
      profit: 150,
    },
    {
      date: "2023-05-03",
      bets: 55,
      amount: 550,
      winnings: 650,
      profit: 100,
    },
  ];

  if (isUserLoading || !user) {
    return null; // or a loading spinner
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
        <UserRoleHeader username={user.username} role={user.role} />
        <ScrollView className="flex-1 p-4">
          <BetSummaryCard {...summary} />
          <DailyBetsTable bets={dailyBets} />
        </ScrollView>
      </StyledSafeAreaView>
    </GestureHandlerRootView>
  );
}
