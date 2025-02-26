import React, { View, TouchableOpacity } from "react-native";
//@ts-ignore
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DataTable } from "react-native-paper";
//@ts-ignore
import { Dimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

// Types and interfaces can stay outside
type GameFilter = "all" | "LAST TWO" | "SWERTRES";

interface Bet {
  id: string;
  combination: string;
  amount: number;
  game_title: string;
  draw_time: string;
  bet_date: string;
  status: string;
  username: string;
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
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeGameFilter, setActiveGameFilter] = useState<GameFilter>("all");

  // Screen width for table columns
  const screenWidth = Dimensions.get("window").width;
  const getColumnWidth = (percentage: number) =>
    (screenWidth * percentage) / 100;

  // Fetch bets query
  const { data: betsData = [], isLoading } = useQuery({
    queryKey: ["dailyBets", selectedDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data: bets, error: betsError } = await supabase
        .from("bets_with_username_table")
        .select("*")
        .eq("bet_date", dateStr)
        .order("created_at", { ascending: false });

      if (betsError) throw betsError;

      return bets || [];
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const filteredBets = betsData.filter((bet) => {
    if (activeGameFilter === "all") return true;
    return bet.game_title === activeGameFilter;
  });

  const totalBets = filteredBets.length;
  const totalAmount = filteredBets.reduce(
    (sum, bet) => sum + Number(bet.amount),
    0
  );

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header Section */}
      <StyledView className="p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#6F13F5" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold text-[#6F13F5]">
            Daily Bets
          </ThemedText>
        </StyledView>

        {/* Date Navigation */}
        <StyledView className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-4">
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              setSelectedDate(newDate);
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#6F13F5" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-1 mx-4"
          >
            <ThemedText className="text-center text-[#6F13F5]">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              if (newDate < today) {
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#6F13F5" />
          </TouchableOpacity>
        </StyledView>

        {/* Stats Cards */}
        <StyledView className="flex-row mb-4 space-x-2">
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Total Bets</ThemedText>
            <ThemedText className="text-2xl font-bold text-[#6F13F5]">
              {totalBets}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Total Amount</ThemedText>
            <ThemedText className="text-2xl font-bold text-[#6F13F5]">
              ₱{totalAmount.toLocaleString()}
            </ThemedText>
          </StyledView>
        </StyledView>

        {/* Add Game Filter Tabs after Stats Cards */}
        <StyledView className="px-4 mb-4">
          <StyledView className="flex-row bg-gray-100 rounded-lg p-1">
            {[
              { id: "all", label: "All" },
              { id: "LAST TWO", label: "Last Two" },
              { id: "SWERTRES", label: "Swertres" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveGameFilter(filter.id as GameFilter)}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  activeGameFilter === filter.id
                    ? "bg-[#6F13F5]"
                    : "bg-transparent"
                }`}
              >
                <ThemedText
                  className={`text-center text-sm font-medium ${
                    activeGameFilter === filter.id
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </StyledView>
        </StyledView>
      </StyledView>

      {/* Table View */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredBets.length > 0 ? (
          <ThemedView className="bg-white rounded-lg shadow">
            <DataTable>
              <DataTable.Header style={{ backgroundColor: "#6F13F5" }}>
                <DataTable.Title style={{ width: getColumnWidth(15) }}>
                  <ThemedText className="font-semibold text-white">
                    Time
                  </ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-semibold text-white">
                    User
                  </ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(30) }}>
                  <ThemedText className="font-semibold text-white">
                    Combination
                  </ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(15) }}>
                  <ThemedText className="font-semibold text-white">
                    Game
                  </ThemedText>
                </DataTable.Title>
                <DataTable.Title numeric style={{ width: getColumnWidth(15) }}>
                  <ThemedText className="font-semibold text-white">
                    Amount
                  </ThemedText>
                </DataTable.Title>
              </DataTable.Header>

              {filteredBets.map((bet) => (
                <DataTable.Row key={bet.id}>
                  <DataTable.Cell style={{ width: getColumnWidth(15) }}>
                    <ThemedText>{formatDrawTime(bet.draw_time)}</ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                    <ThemedText>
                      {bet.username || bet.user_id.slice(0, 8)}
                    </ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(30) }}>
                    <ThemedText className="font-medium">
                      {bet.combination}
                    </ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(15) }}>
                    <ThemedView className="bg-gray-100 px-2 py-1 rounded">
                      <ThemedText className="text-xs">
                        {bet.game_title === "LAST TWO" ? "L2" : "3D"}
                      </ThemedText>
                    </ThemedView>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ width: getColumnWidth(15) }}>
                    <ThemedText className="text-[#6F13F5] font-medium">
                      ₱{Number(bet.amount).toLocaleString()}
                    </ThemedText>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ThemedView>
        ) : (
          <StyledView className="bg-white p-8 rounded-lg shadow mb-3 items-center">
            <ThemedText className="text-gray-500 text-lg">
              No{" "}
              {activeGameFilter === "all" ? "" : activeGameFilter.toLowerCase()}{" "}
              bet(s) for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </ThemedText>
          </StyledView>
        )}
      </ScrollView>

      {/* Date Picker */}
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
    </StyledSafeAreaView>
  );
}
