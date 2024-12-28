//@ts-ignore
import { View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function DailyBetsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1">
        {/* Header */}
        <StyledView className="p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <StyledView className="flex-row items-center">
              <MaterialIcons name="arrow-back" size={24} color="#000" />
              <ThemedText className="ml-2 text-base text-gray-600">
                Back
              </ThemedText>
            </StyledView>
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">Daily Bets</ThemedText>
        </StyledView>

        {/* Date Picker */}
        <StyledView className="p-4">
          <TouchableOpacity
            className="flex-row items-center p-4 bg-white rounded-lg border border-gray-200"
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color="#6F13F5" />
            <ThemedText className="ml-2">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </ThemedText>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}
        </StyledView>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <StyledView className="min-w-full">
            {/* Table Header */}
            <StyledView className="flex-row bg-[#F7F5FA] border-y border-gray-200">
              <ThemedText className="w-32 p-4 font-semibold text-[#6F13F5]">
                Time
              </ThemedText>
              <ThemedText className="w-28 p-4 font-semibold text-[#6F13F5]">
                Number
              </ThemedText>
              <ThemedText className="w-28 p-4 font-semibold text-[#6F13F5]">
                Amount
              </ThemedText>
              <ThemedText className="w-24 p-4 font-semibold text-[#6F13F5]">
                Type
              </ThemedText>
            </StyledView>

            {/* Table Content */}
            <ScrollView>
              {[
                { time: "11:00 AM", number: "23", amount: "₱100", type: "L2" },
                { time: "11:00 AM", number: "456", amount: "₱200", type: "3D" },
                { time: "4:00 PM", number: "78", amount: "₱150", type: "L2" },
                { time: "9:00 PM", number: "901", amount: "₱300", type: "3D" },
              ].map((bet, index) => (
                <StyledView
                  key={index}
                  className="flex-row border-b border-gray-100 bg-white"
                >
                  <ThemedText className="w-32 p-4">{bet.time}</ThemedText>
                  <ThemedText className="w-28 p-4">{bet.number}</ThemedText>
                  <ThemedText className="w-28 p-4">{bet.amount}</ThemedText>
                  <ThemedText className="w-24 p-4">{bet.type}</ThemedText>
                </StyledView>
              ))}
            </ScrollView>
          </StyledView>
        </ScrollView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
