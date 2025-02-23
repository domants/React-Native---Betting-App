import { View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

// Types and interfaces can stay outside
type GameFilter = "all" | "l2" | "3d";

interface Bet {
  id: string;
  combination: string;
  amount: number;
  game_title: string;
  draw_time: string;
  bet_date: string;
  status: string;
}

// Helper functions that don't use state can stay outside
function formatDrawTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);

  if (hour === 11) return "11 AM";
  if (hour === 17) return "5 PM";
  if (hour === 21) return "9 PM";

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${ampm}`;
}

export default function DailyBetsScreen() {
  // Move all state declarations inside the component
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeGameFilter, setActiveGameFilter] = useState<GameFilter>("all");
  const [showGameDropdown, setShowGameDropdown] = useState(false);

  // Move the navigation function inside the component since it uses state
  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const typeOptions = [
    { label: "All Types", value: "" },
    { label: "L2", value: "L2" },
    { label: "3D", value: "3D" },
  ];

  // At the start of your component, add this debug query
  useQuery({
    queryKey: ["debugBets"],
    queryFn: async () => {
      // First check if table exists
      const { data: tables } = await supabase
        .from("pg_tables")
        .select("tablename")
        .eq("schemaname", "public");
      console.log("Available tables:", tables);

      // Try to get the first row to see table structure
      const { data: sampleRow, error: sampleError } = await supabase
        .from("bets")
        .select("*")
        .limit(1);
      console.log("Sample bet row:", sampleRow);
      if (sampleError) console.error("Sample error:", sampleError);

      // Get the count
      const { count, error } = await supabase
        .from("bets")
        .select("*", { count: "exact", head: true });

      console.log("Total rows in bets table:", count);
      if (error) console.error("Count error:", error);

      return count;
    },
  });

  // Modify the test connection query
  useQuery({
    queryKey: ["testConnection"],
    queryFn: async () => {
      const { data: session, error: sessionError } =
        await supabase.auth.getSession();
      console.log("Auth status:", {
        isAuthenticated: !!session?.session,
        user: session?.session?.user?.id,
        role: session?.session?.user?.role,
      });
      if (sessionError) console.error("Session error:", sessionError);
      return session;
    },
  });

  // Fetch bets and results for the selected date
  const { data: betsData = [], isLoading: isBetsLoading } = useQuery({
    queryKey: ["dailyBets", selectedDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      console.log("Querying for date:", dateStr);

      // First get draw results for the date
      const { data: drawResults, error: drawError } = await supabase
        .from("draw_results")
        .select("*")
        .eq("draw_date", dateStr);

      if (drawError) {
        console.error("Draw results error:", drawError);
        throw drawError;
      }
      console.log("Draw results:", drawResults);

      // Then get bets for the specific date
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select("*")
        .eq("bet_date", dateStr)
        .order("created_at", { ascending: false });

      if (betsError) {
        console.error("Bets error:", betsError);
        throw betsError;
      }

      console.log("Raw bets data:", bets);

      // Process bets to determine win/loss status
      const processedBets = (bets || []).map((bet: any) => {
        const matchingResult = drawResults?.find(
          (result) => result.draw_time === bet.draw_time
        );

        let status = "Pending";
        if (matchingResult) {
          const winningNumber =
            bet.game_title === "LAST TWO"
              ? matchingResult.l2_result
              : matchingResult.d3_result;

          status = bet.combination === winningNumber ? "Won" : "Lost";
        }

        return {
          ...bet,
          status,
        } as Bet;
      });

      console.log("Processed bets for date", dateStr, ":", processedBets);
      return processedBets;
    },
  });

  if (isBetsLoading) {
    return <LoadingSpinner />;
  }

  // Update the filtering logic
  const filteredBets = betsData.filter((bet: Bet) => {
    if (activeGameFilter === "l2") {
      return bet.game_title === "LAST TWO";
    }
    if (activeGameFilter === "3d") {
      return bet.game_title === "SWERTRES";
    }
    return true; // "all" filter
  });

  const totalBets = filteredBets.length;
  const totalAmount = filteredBets.reduce(
    (sum: number, bet: Bet) => sum + bet.amount,
    0
  );
  const totalWinnings = filteredBets
    .filter((bet: Bet) => bet.status === "Won")
    .reduce((sum: number, bet: Bet) => {
      const multiplier = bet.game_title === "L2" ? 80 : 400;
      return sum + bet.amount * multiplier;
    }, 0);

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Fixed Header Section */}
      <StyledView className="p-4">
        {/* Header */}
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">Daily Bets</ThemedText>
        </StyledView>

        {/* Date Navigation */}
        <StyledView className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-4">
          <TouchableOpacity onPress={() => navigateDate("prev")}>
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-1 mx-4"
          >
            <ThemedText className="text-center">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigateDate("next")}>
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </StyledView>

        {/* Stats Cards */}
        <StyledView className="flex-row mb-4 space-x-2">
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Total Bets</ThemedText>
            <ThemedText className="text-2xl font-bold">{totalBets}</ThemedText>
          </StyledView>
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Total Amount</ThemedText>
            <ThemedText className="text-2xl font-bold">
              ₱{totalAmount.toLocaleString()}
            </ThemedText>
          </StyledView>
        </StyledView>

        {/* Game Type Dropdown */}
        <TouchableOpacity
          onPress={() => setShowGameDropdown(!showGameDropdown)}
          className="mb-4 p-4 border border-gray-200 rounded-lg flex-row justify-between items-center"
        >
          <ThemedText>
            {activeGameFilter === "all"
              ? "All Games"
              : activeGameFilter === "l2"
              ? "Last Two"
              : "Swertres"}
          </ThemedText>
          <MaterialIcons
            name={
              showGameDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"
            }
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </StyledView>

      {/* Scrollable Bets List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredBets.length > 0 ? (
          filteredBets.map((bet: Bet) => (
            <StyledView
              key={bet.id}
              className="bg-white p-4 rounded-lg shadow mb-3 flex-row justify-between items-center"
            >
              <StyledView>
                <ThemedText className="text-gray-600">
                  Time: {formatDrawTime(bet.draw_time)}
                </ThemedText>
                <ThemedText className="text-xl font-semibold mt-1">
                  {bet.combination}
                </ThemedText>
              </StyledView>

              <StyledView className="items-end">
                <StyledView className="bg-gray-100 px-2 py-1 rounded">
                  <ThemedText className="text-sm">
                    Game Type: {bet.game_title === "LAST TWO" ? "L2" : "3D"}
                  </ThemedText>
                </StyledView>
                <ThemedText className="text-[#6F13F5] font-bold mt-1">
                  Amount: ₱{bet.amount.toLocaleString()}
                </ThemedText>
              </StyledView>
            </StyledView>
          ))
        ) : (
          <StyledView className="bg-white p-8 rounded-lg shadow mb-3 items-center">
            <ThemedText className="text-gray-500 text-lg">
              No bet(s) for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </ThemedText>
          </StyledView>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
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

      {/* Game Type Dropdown Menu */}
      {showGameDropdown && (
        <StyledView className="bg-white rounded-lg shadow absolute top-[215] left-4 right-4 z-10">
          {[
            { id: "all", label: "All Games" },
            { id: "l2", label: "Last Two" },
            { id: "3d", label: "Swertres" },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                setActiveGameFilter(option.id as GameFilter);
                setShowGameDropdown(false);
              }}
              className={`p-4 border-b border-gray-100 ${
                activeGameFilter === option.id ? "bg-gray-50" : ""
              }`}
            >
              <ThemedText
                className={
                  activeGameFilter === option.id
                    ? "text-[#6F13F5]"
                    : "text-gray-600"
                }
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </StyledView>
      )}
    </StyledSafeAreaView>
  );
}
