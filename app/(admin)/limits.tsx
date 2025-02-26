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
  const [betDate, setBetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastTwoNumber, setLastTwoNumber] = useState("");
  const [lastTwoLimit, setLastTwoLimit] = useState("");
  const [swertresNumber, setSwertresNumber] = useState("");
  const [swertresLimit, setSwertresLimit] = useState("");

  const handleSetLimits = async () => {
    try {
      // Insert Last Two limit if provided
      if (lastTwoNumber && lastTwoLimit) {
        if (lastTwoNumber.length !== 2) {
          Alert.alert("Invalid Number", "Last Two number must be 2 digits");
          return;
        }

        // First check if a limit already exists
        const { data: existingL2Limit } = await supabase
          .from("bet_limits")
          .select("*")
          .eq("bet_date", betDate.toISOString().split("T")[0])
          .eq("game_title", "LAST TWO")
          .eq("number", lastTwoNumber)
          .single();

        if (existingL2Limit) {
          // If exists, show detailed info and ask user if they want to update
          Alert.alert(
            "Limit Already Exists",
            `A limit for Last Two number ${lastTwoNumber} already exists:\n\n` +
              `Current Limit: ₱${existingL2Limit.limit_amount.toLocaleString()}\n` +
              `New Limit: ₱${parseFloat(lastTwoLimit).toLocaleString()}\n\n` +
              `Would you like to update it?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Update",
                onPress: async () => {
                  const { error: updateError } = await supabase
                    .from("bet_limits")
                    .update({ limit_amount: parseFloat(lastTwoLimit) })
                    .eq("id", existingL2Limit.id);

                  if (updateError) throw updateError;
                  setLastTwoNumber("");
                  setLastTwoLimit("");
                  Alert.alert(
                    "Success",
                    `Limit for Last Two number ${lastTwoNumber} updated to ₱${parseFloat(
                      lastTwoLimit
                    ).toLocaleString()}`
                  );
                },
              },
            ]
          );
          return;
        }

        // If no existing limit, insert new one
        const { error: l2Error } = await supabase.from("bet_limits").insert({
          bet_date: betDate.toISOString().split("T")[0],
          game_title: "LAST TWO",
          number: lastTwoNumber,
          limit_amount: parseFloat(lastTwoLimit),
        });

        if (l2Error) throw l2Error;
      }

      // Insert Swertres limit if provided
      if (swertresNumber && swertresLimit) {
        if (swertresNumber.length !== 3) {
          Alert.alert("Invalid Number", "Swertres number must be 3 digits");
          return;
        }

        // First check if a limit already exists
        const { data: existingD3Limit } = await supabase
          .from("bet_limits")
          .select("*")
          .eq("bet_date", betDate.toISOString().split("T")[0])
          .eq("game_title", "SWERTRES")
          .eq("number", swertresNumber)
          .single();

        if (existingD3Limit) {
          // If exists, show detailed info and ask user if they want to update
          Alert.alert(
            "Limit Already Exists",
            `A limit for Swertres number ${swertresNumber} already exists:\n\n` +
              `Current Limit: ₱${existingD3Limit.limit_amount.toLocaleString()}\n` +
              `New Limit: ₱${parseFloat(swertresLimit).toLocaleString()}\n\n` +
              `Would you like to update it?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Update",
                onPress: async () => {
                  const { error: updateError } = await supabase
                    .from("bet_limits")
                    .update({ limit_amount: parseFloat(swertresLimit) })
                    .eq("id", existingD3Limit.id);

                  if (updateError) throw updateError;
                  setSwertresNumber("");
                  setSwertresLimit("");
                  Alert.alert(
                    "Success",
                    `Limit for Swertres number ${swertresNumber} updated to ₱${parseFloat(
                      swertresLimit
                    ).toLocaleString()}`
                  );
                },
              },
            ]
          );
          return;
        }

        // If no existing limit, insert new one
        const { error: d3Error } = await supabase.from("bet_limits").insert({
          bet_date: betDate.toISOString().split("T")[0],
          game_title: "SWERTRES",
          number: swertresNumber,
          limit_amount: parseFloat(swertresLimit),
        });

        if (d3Error) throw d3Error;
      }

      // Clear form only if both operations succeed
      setLastTwoNumber("");
      setLastTwoLimit("");
      setSwertresNumber("");
      setSwertresLimit("");

      Alert.alert("Success", "Bet limits have been set successfully!");
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
            <MaterialIcons name="arrow-back" size={24} color="#6F13F5" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold text-[#6F13F5]">
            Set Bet Limits
          </ThemedText>
        </StyledView>

        <StyledView className="space-y-4">
          {/* Date Picker */}
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
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setBetDate(date);
                }}
              />
            )}
          </StyledView>

          {/* Last Two Section */}
          <StyledView>
            <ThemedText className="text-lg font-semibold mb-3">
              Last Two
            </ThemedText>
            <StyledView className="space-y-4">
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                placeholder="Enter 2 digit number"
                value={lastTwoNumber}
                onChangeText={setLastTwoNumber}
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                placeholder="Enter limit amount"
                value={lastTwoLimit}
                onChangeText={setLastTwoLimit}
                keyboardType="numeric"
              />
            </StyledView>
          </StyledView>

          {/* Divider */}
          <StyledView className="h-[1px] bg-gray-200" />

          {/* Swertres Section */}
          <StyledView>
            <ThemedText className="text-lg font-semibold mb-3">
              Swertres
            </ThemedText>
            <StyledView className="space-y-4">
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                placeholder="Enter 3 digit number"
                value={swertresNumber}
                onChangeText={setSwertresNumber}
                keyboardType="numeric"
                maxLength={3}
              />
              <TextInput
                className="w-full p-4 bg-white rounded-lg border border-gray-200"
                placeholder="Enter limit amount"
                value={swertresLimit}
                onChangeText={setSwertresLimit}
                keyboardType="numeric"
              />
            </StyledView>
          </StyledView>

          {/* Submit Button */}
          <TouchableOpacity
            className="mt-6 bg-[#6F13F5] p-4 rounded-lg"
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
