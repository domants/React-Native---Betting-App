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
type GameFilter = "all" | "l2" | "3d";

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

  const totalBets = betsData.length;
  const totalAmount = betsData.reduce(
    (sum, bet) => sum + Number(bet.amount),
    0
  );

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header Section */}
      <StyledView className="p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">Daily Bets</ThemedText>
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

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              if (newDate < today) {
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </StyledView>

        {/* Stats Summary */}
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
      </StyledView>

      {/* Table View */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {betsData.length > 0 ? (
          <ThemedView className="bg-white rounded-lg shadow">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={{ width: getColumnWidth(10) }}>
                  <ThemedText className="font-semibold">Time</ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-semibold">User</ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(45) }}>
                  <ThemedText className="font-semibold">Combination</ThemedText>
                </DataTable.Title>
                <DataTable.Title style={{ width: getColumnWidth(8) }}>
                  <ThemedText className="font-semibold">Game</ThemedText>
                </DataTable.Title>
                <DataTable.Title numeric style={{ width: getColumnWidth(12) }}>
                  <ThemedText className="font-semibold">Amount</ThemedText>
                </DataTable.Title>
              </DataTable.Header>

              {betsData.map((bet) => (
                <DataTable.Row key={bet.id}>
                  <DataTable.Cell style={{ width: getColumnWidth(10) }}>
                    <ThemedText>{formatDrawTime(bet.draw_time)}</ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                    <ThemedText className="w-80">
                      {bet.username || bet.user_id.slice(0, 8)}
                    </ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(45) }}>
                    <ThemedText>{bet.combination}</ThemedText>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: getColumnWidth(8) }}>
                    <ThemedView className="bg-gray-100 px-2 py-1 rounded">
                      <ThemedText className="text-xs">
                        {bet.game_title === "LAST TWO" ? "L2" : "3D"}
                      </ThemedText>
                    </ThemedView>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ width: getColumnWidth(12) }}>
                    <ThemedText className="text-[#6F13F5] font-medium ">
                      ₱{Number(bet.amount).toLocaleString()}
                    </ThemedText>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}

              {/* Table Footer */}
              <DataTable.Row style={{ backgroundColor: "#F9FAFB" }}>
                <DataTable.Cell style={{ width: getColumnWidth(10) }}>
                  <ThemedText className="font-bold">Total</ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ width: getColumnWidth(25) }}>
                  <ThemedText className="font-bold">
                    {totalBets} bets
                  </ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ width: getColumnWidth(53) }}>
                  <ThemedText>{""}</ThemedText>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ width: getColumnWidth(12) }}>
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
