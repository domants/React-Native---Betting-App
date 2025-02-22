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

interface DrawResult {
  id: string;
  draw_date: string;
  draw_time: string;
  l2_result: string;
  d3_result: string;
}

// Helper function to format date
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Add this helper function near the top with other helpers
const formatTime = (timeString: string) => {
  try {
    // Parse the time string
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);

    // Convert to 12-hour format
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${displayHour}:${minutes} ${period}`;
  } catch (error) {
    return timeString; // Return original if parsing fails
  }
};

export default function ResultsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch results for the selected date
  const { data: results, isLoading } = useQuery({
    queryKey: ["drawResults", selectedDate.toISOString().split("T")[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("draw_results")
        .select("*")
        .eq("draw_date", selectedDate.toISOString().split("T")[0])
        .order("draw_time", { ascending: true });

      if (error) throw error;
      return data as DrawResult[];
    },
  });

  // Get latest results
  const latestL2 = results?.[results.length - 1]?.l2_result || "--";
  const latest3D = results?.[results.length - 1]?.d3_result || "---";

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
            Draw Results
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

          {/* Latest Results Cards */}
          <StyledView className="flex-row justify-between mb-6">
            <ThemedView className="w-[48%] p-4 bg-white rounded-xl border border-gray-200">
              <ThemedText className="text-gray-600 mb-2">
                Latest L2 Result
              </ThemedText>
              <ThemedText className="text-4xl font-bold">{latestL2}</ThemedText>
            </ThemedView>

            <ThemedView className="w-[48%] p-4 bg-white rounded-xl border border-gray-200">
              <ThemedText className="text-gray-600 mb-2">
                Latest 3D Result
              </ThemedText>
              <ThemedText className="text-4xl font-bold">{latest3D}</ThemedText>
            </ThemedView>
          </StyledView>

          {/* Results Table */}
          <ThemedView className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ThemedText className="p-4 text-lg font-bold">
              Results for {formatDate(selectedDate)}
            </ThemedText>

            <StyledView className="flex-row bg-gray-50 p-3 border-b border-gray-200">
              <ThemedText className="flex-1 font-semibold">Time</ThemedText>
              <ThemedText className="w-24 font-semibold">L2 Result</ThemedText>
              <ThemedText className="w-24 font-semibold">3D Result</ThemedText>
            </StyledView>

            {results && results.length > 0 ? (
              results.map((result) => (
                <StyledView
                  key={result.id}
                  className="flex-row p-3 border-b border-gray-200"
                >
                  <ThemedText className="flex-1">
                    {formatTime(result.draw_time)}
                  </ThemedText>
                  <ThemedText className="w-24">
                    {result.l2_result || "--"}
                  </ThemedText>
                  <ThemedText className="w-24">
                    {result.d3_result || "---"}
                  </ThemedText>
                </StyledView>
              ))
            ) : (
              <StyledView className="p-4">
                <ThemedText className="text-center text-gray-500">
                  No results for this date
                </ThemedText>
              </StyledView>
            )}
          </ThemedView>
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
