import { View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

const timeSlots = [
  { label: "2:00 PM", value: "14:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "9:00 PM", value: "21:00" },
];

export default function ResultsScreen() {
  const [drawDate, setDrawDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [drawTime, setDrawTime] = useState("");
  const [last2Result, setLast2Result] = useState("");
  const [d3Result, setD3Result] = useState("");

  const handleAddResult = () => {
    console.log("Adding result...", {
      drawDate,
      drawTime,
      last2Result,
      d3Result,
    });
    // Add your save logic here
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">
            Add Draw Results
          </ThemedText>
        </StyledView>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-base mb-2">Draw Date</ThemedText>
            <TouchableOpacity
              className="w-full p-4 bg-white rounded-lg border border-gray-200 flex-row justify-between items-center"
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>
                {drawDate.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </ThemedText>
              <MaterialIcons name="calendar-today" size={24} color="#6F13F5" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={drawDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDrawDate(selectedDate);
                  }
                }}
              />
            )}
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">Draw Time</ThemedText>
            <Dropdown
              style={{
                height: 56,
                borderColor: "#E5E7EB",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                backgroundColor: "white",
              }}
              placeholderStyle={{
                fontSize: 16,
                color: "#666",
              }}
              selectedTextStyle={{
                fontSize: 16,
                color: "#000",
              }}
              data={timeSlots}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select time"
              value={drawTime}
              onChange={(item) => setDrawTime(item.value)}
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">Last 2 Result</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter 2 digits"
              value={last2Result}
              onChangeText={setLast2Result}
              keyboardType="numeric"
              maxLength={2}
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-base mb-2">3D Result</ThemedText>
            <TextInput
              className="w-full p-4 bg-white rounded-lg border border-gray-200"
              placeholder="Enter 3 digits"
              value={d3Result}
              onChangeText={setD3Result}
              keyboardType="numeric"
              maxLength={3}
            />
          </StyledView>
        </StyledView>

        <TouchableOpacity
          className="mt-auto bg-black p-4 rounded-lg"
          onPress={handleAddResult}
        >
          <ThemedText className="text-white text-center font-semibold text-base">
            Add Result
          </ThemedText>
        </TouchableOpacity>
      </StyledView>
    </StyledSafeAreaView>
  );
}
