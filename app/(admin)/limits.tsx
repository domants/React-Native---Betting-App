import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function LimitsScreen() {
  const [last2Limit, setLast2Limit] = useState("");
  const [d3Limit, setD3Limit] = useState("");
  const [betDate, setBetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBetDate(selectedDate);
    }
  };

  const handleSetLimits = async () => {
    // Validate inputs
    if (!last2Limit || !d3Limit) {
      Alert.alert(
        "Validation Error",
        "Both Last 2 Bet Limit and 3D Bet Limit are required. Please enter both values."
      );
      return;
    }

    try {
      // Insert both limits in a single record
      const { error } = await supabase.from("bet_limits").insert({
        l2_limit_amount: parseFloat(last2Limit),
        d3_limit_amount: parseFloat(d3Limit),
        bet_date: betDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      });

      if (error) throw error;

      // Clear form after successful submission
      setLast2Limit("");
      setD3Limit("");
      setBetDate(new Date());

      // Show success message
      Alert.alert("Success", "Bet limits have been set successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error setting limits:", error);
      Alert.alert("Error", "Failed to set bet limits. Please try again.");
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">Set Bet Limits</ThemedText>
        </StyledView>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-base mb-2">Bet Date</ThemedText>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
            >
              <ThemedText>{betDate.toLocaleDateString()}</ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={betDate}
                mode="date"
                onChange={handleDateChange}
              />
            )}
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">Last 2 Bet Limit</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter limit for L2"
              value={last2Limit}
              onChangeText={setLast2Limit}
              keyboardType="numeric"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">3D Bet Limit</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter limit for 3D"
              value={d3Limit}
              onChangeText={setD3Limit}
              keyboardType="numeric"
            />
          </StyledView>

          <TouchableOpacity
            className="mt-auto bg-black p-4 rounded-lg"
            onPress={handleSetLimits}
          >
            <ThemedText className="text-white text-center font-semibold text-base">
              Set Limits
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
