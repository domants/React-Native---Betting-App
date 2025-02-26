import React, { View, TouchableOpacity, TextInput, Alert } from "react-native";
//@ts-ignore
import { ScrollView } from "react-native";
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
import { DataTable } from "react-native-paper";
//@ts-ignore
import { Dimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSubordinates } from "@/hooks/useSubordinates";

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
  user_id: string;
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

export default function ResultsScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeGameFilter, setActiveGameFilter] = useState<GameFilter>("all");
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { data: allSubordinates } = useSubordinates();
  const [showGameDropdown, setShowGameDropdown] = useState(false);

  // Replace the useMemo block with a regular function
  const getFilteredSubordinates = () => {
    if (!user || !allSubordinates) return [];

    // If coordinator, only include actual subordinates (not self)
    if (user.role === "Coordinator") {
      return allSubordinates.filter((id) => id !== user.id);
    }

    return allSubordinates;
  };

  // Use the function to get subordinateIds
  const subordinateIds = getFilteredSubordinates();

  // Add component level logging
  console.log("Component State:", {
    currentUser: {
      id: user?.id,
      role: user?.role,
      isLoading: isUserLoading,
    },
    subordinates: {
      all: allSubordinates,
      filtered: subordinateIds,
    },
  });

  // Fetch bets and results for the selected date
  const { data: betsData = [], isLoading: isBetsLoading } = useQuery({
    queryKey: [
      "resultBets",
      selectedDate.toISOString().split("T")[0],
      subordinateIds,
    ],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // First check authentication status
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      console.log("1. Query Setup:", {
        auth: {
          isAuthenticated: !!session,
          userId: session?.user?.id,
          role: user?.role,
        },
        subordinates: subordinateIds,
        date: dateStr,
      });

      // Query bets for all subordinates
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select("*")
        .in("user_id", subordinateIds) // Use .in() to query multiple subordinates
        .eq("bet_date", dateStr);

      console.log("2. Query Results:", {
        success: !betsError,
        count: bets?.length,
        error: betsError,
        queryParams: {
          subordinateIds,
          date: dateStr,
        },
      });

      if (betsError) {
        console.error("Query Error:", betsError);
        throw betsError;
      }

      return (bets || []).map((bet) => ({
        ...bet,
        status: "Pending",
      }));
    },
    enabled: !isUserLoading && !!subordinateIds,
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

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    } else {
      // Don't allow navigating to future dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (newDate < tomorrow) {
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
      }
    }
  }

  // Replace the screenWidth calculation
  const screenWidth = Dimensions.get("window").width;
  const getColumnWidth = (percentage: number) =>
    (screenWidth * percentage) / 100;

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

      {/* Replace the ScrollView section with this: */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredBets.length > 0 ? (
          <ThemedView className="bg-white rounded-lg shadow">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={{ width: getColumnWidth(20) }}>
                  <ThemedText className="font-semibold">Time</ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-semibold">Combination</ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-semibold">Game</ThemedText>
                </DataTable.Title>
                <DataTable.Title numeric style={{ width: getColumnWidth(30) }}>
                  <ThemedText className="font-semibold">Amount</ThemedText>
                </DataTable.Title>
              </DataTable.Header>

              {filteredBets.map((bet: Bet) => (
                <DataTable.Row key={bet.id}>
                  <DataTable.Cell style={{ width: getColumnWidth(20) }}>
                    <ThemedText>{formatDrawTime(bet.draw_time)}</ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                    <ThemedText className="font-medium">
                      {bet.combination}
                    </ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                    <ThemedView className="bg-gray-100 px-2 py-1 rounded">
                      <ThemedText className="text-sm">
                        {bet.game_title === "LAST TWO" ? "L2" : "3D"}
                      </ThemedText>
                    </ThemedView>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ width: getColumnWidth(30) }}>
                    <ThemedText className="text-[#6F13F5] font-medium">
                      ₱{bet.amount.toLocaleString()}
                    </ThemedText>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}

              {/* Table Footer with Totals */}
              <DataTable.Row style={{ backgroundColor: "#F9FAFB" }}>
                <DataTable.Cell style={{ width: getColumnWidth(20) }}>
                  <ThemedText className="font-bold">Total</ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-bold">
                    {totalBets} bets
                  </ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                  <ThemedText>{""}</ThemedText>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ width: getColumnWidth(30) }}>
                  <ThemedText className="text-[#6F13F5] font-bold">
                    ₱{totalAmount.toLocaleString()}
                  </ThemedText>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </ThemedView>
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
            if (date && date <= today) {
              setSelectedDate(date);
            }
          }}
          maximumDate={today}
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
