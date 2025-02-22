import { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface WinningBet {
  id: string;
  user_id: string;
  combination: string;
  amount: number;
  is_rumble: boolean;
  game_title: string;
  draw_time: string;
  bet_date: string;
}

type ResultFilter = "all" | "l2" | "3d";

// Helper function to format date
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function WinnersScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ResultFilter>("all");

  // Fetch winning bets for the selected date
  const { data: winningBets = [], isLoading } = useQuery({
    queryKey: ["winningBets", selectedDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      console.log("Fetching for date:", dateStr);

      // First get the draw results for the date
      const { data: drawResults, error: drawError } = await supabase
        .from("draw_results")
        .select("*")
        .eq("draw_date", dateStr);

      if (drawError) throw drawError;
      console.log("Draw Results:", drawResults);

      // Then get all bets for the date
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select(
          `
          id,
          user_id,
          combination,
          amount,
          is_rumble,
          game_title,
          draw_time,
          bet_date
        `
        )
        .eq("bet_date", dateStr);

      if (betsError) {
        console.log("Bets Error:", betsError);
        throw betsError;
      }

      console.log("Bets Query:", {
        dateStr,
        betsData: bets,
        betsCount: bets?.length || 0,
      });

      // Match winning bets with more detailed logging
      const winners = bets.filter((bet) => {
        console.log("Checking bet:", {
          combination: bet.combination,
          game_title: bet.game_title,
          bet_time: bet.draw_time,
          bet_date: bet.bet_date,
          draw_time_type: typeof bet.draw_time,
        });

        const matchingResult = drawResults.find((result) => {
          // Convert times to comparable format (HH:mm:ss)
          const betTime =
            bet.draw_time.split(":").slice(0, 2).join(":") + ":00";
          const resultTime = result.draw_time;

          const isTimeMatch = resultTime === betTime;
          const isL2Match =
            bet.game_title.includes("LAST TWO") &&
            result.l2_result === bet.combination;
          const is3DMatch =
            bet.game_title.includes("3D") &&
            result.d3_result === bet.combination;

          console.log("Comparing with result:", {
            bet_time: betTime,
            result_time: resultTime,
            bet_combination: bet.combination,
            bet_game_title: bet.game_title,
            result_l2: result.l2_result,
            result_3d: result.d3_result,
            isTimeMatch,
            isL2Match,
            is3DMatch,
          });

          return isTimeMatch && (isL2Match || is3DMatch);
        });

        const isWinner = matchingResult !== undefined;
        console.log("Is winner:", isWinner);
        return isWinner;
      });

      console.log("Final winners:", winners);
      return winners as WinningBet[];
    },
  });

  // Filter results based on active filter
  const filteredWinners = winningBets.filter((bet) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "l2") return bet.game_title.includes("LAST TWO");
    if (activeFilter === "3d") return bet.game_title.includes("3D");
    return true;
  });

  // Calculate totals
  const totalWinners = filteredWinners.length;
  const totalPayout = filteredWinners.reduce((sum, bet) => {
    // Calculate payout based on game type
    const multiplier = bet.game_title === "L2" ? 80 : 400;
    return sum + bet.amount * multiplier;
  }, 0);

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <StyledView className="p-4">
          <ThemedText className="text-2xl font-bold mb-4">
            Winners Result
          </ThemedText>

          {/* Date Navigation */}
          <StyledView className="flex-row justify-between items-center mb-6 bg-gray-50 p-3 rounded-xl">
            <TouchableOpacity onPress={handlePreviousDay}>
              <StyledView className="flex-row items-center">
                <MaterialIcons name="chevron-left" size={24} color="#6F13F5" />
                <ThemedText className="text-[#6F13F5]">Previous Day</ThemedText>
              </StyledView>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <ThemedText className="text-lg font-semibold">
                {formatDate(selectedDate)}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextDay}>
              <StyledView className="flex-row items-center">
                <ThemedText className="text-[#6F13F5]">Next Day</ThemedText>
                <MaterialIcons name="chevron-right" size={24} color="#6F13F5" />
              </StyledView>
            </TouchableOpacity>
          </StyledView>

          {/* Summary Cards */}
          <StyledView className="flex-row justify-between mb-6">
            <ThemedView className="w-[48%] p-4 bg-white rounded-xl border border-gray-200">
              <ThemedText className="text-gray-600 mb-2">
                Total Winners
              </ThemedText>
              <ThemedText className="text-3xl font-bold">
                {totalWinners}
              </ThemedText>
            </ThemedView>

            <ThemedView className="w-[48%] p-4 bg-white rounded-xl border border-gray-200">
              <ThemedText className="text-gray-600 mb-2">
                Total Payout
              </ThemedText>
              <ThemedText className="text-3xl font-bold">
                ₱{totalPayout.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </StyledView>

          {/* Filter Tabs */}
          <StyledView className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeFilter === "all"
                  ? "bg-[#6F13F5]"
                  : "bg-transparent border border-[#6F13F5]"
              }`}
            >
              <ThemedText
                className={`${
                  activeFilter === "all" ? "text-white" : "text-[#6F13F5]"
                }`}
              >
                All
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("l2")}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeFilter === "l2"
                  ? "bg-[#6F13F5]"
                  : "bg-transparent border border-[#6F13F5]"
              }`}
            >
              <ThemedText
                className={`${
                  activeFilter === "l2" ? "text-white" : "text-[#6F13F5]"
                }`}
              >
                L2 Winners
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("3d")}
              className={`px-4 py-2 rounded-full ${
                activeFilter === "3d"
                  ? "bg-[#6F13F5]"
                  : "bg-transparent border border-[#6F13F5]"
              }`}
            >
              <ThemedText
                className={`${
                  activeFilter === "3d" ? "text-white" : "text-[#6F13F5]"
                }`}
              >
                3D Winners
              </ThemedText>
            </TouchableOpacity>
          </StyledView>

          {/* Winners Table */}
          <StyledView className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <StyledView className="flex-row bg-gray-50 p-3 border-b border-gray-200">
              <ThemedText className="w-24 font-semibold">Numbers</ThemedText>
              <ThemedText className="w-24 font-semibold">Bet Amount</ThemedText>
              <ThemedText className="w-24 font-semibold">Payout</ThemedText>
              <ThemedText className="flex-1 font-semibold text-right">
                Action
              </ThemedText>
            </StyledView>

            {filteredWinners.length > 0 ? (
              filteredWinners.map((winner) => (
                <StyledView
                  key={winner.id}
                  className="flex-row p-3 border-b border-gray-200 items-center"
                >
                  <ThemedText className="w-24">{winner.combination}</ThemedText>
                  <ThemedText className="w-24">₱{winner.amount}</ThemedText>
                  <ThemedText className="w-24">
                    ₱
                    {(
                      winner.amount * (winner.game_title === "L2" ? 80 : 400)
                    ).toLocaleString()}
                  </ThemedText>
                  <StyledView className="flex-1 items-end">
                    <TouchableOpacity className="bg-[#6F13F5] px-4 py-2 rounded-full">
                      <ThemedText className="text-white">Details</ThemedText>
                    </TouchableOpacity>
                  </StyledView>
                </StyledView>
              ))
            ) : (
              <StyledView className="p-4">
                <ThemedText className="text-center text-gray-500">
                  No winners for this date
                </ThemedText>
              </StyledView>
            )}
          </StyledView>
        </StyledView>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
    </StyledSafeAreaView>
  );
}
