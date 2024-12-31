import { View, TextInput, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import Modal from "react-native-modal";

import { ThemedText } from "@/components/ThemedText";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface DrawResult {
  id: string;
  date: string;
  time: string;
  l2Result: string;
  d3Result: string;
}

// Helper function to format date
function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// get todays date
const today = new Date();
const dateToday = new Date(today);
dateToday.setDate(dateToday.getDate());

const drawSchedules = [
  {
    label: `${formatDate(dateToday)}, 11 AM`,
    value: `${dateToday.toISOString().split("T")[0]}-11:00`,
  },
  {
    label: `${formatDate(dateToday)}, 5 PM`,
    value: `${dateToday.toISOString().split("T")[0]}-17:00`,
  },
  {
    label: `${formatDate(dateToday)}, 9 PM`,
    value: `${dateToday.toISOString().split("T")[0]}-21:00`,
  },
];

export default function ResultsScreen() {
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [l2Result, setL2Result] = useState("");
  const [d3Result, setD3Result] = useState("");
  const [results, setResults] = useState<DrawResult[]>([
    {
      id: "1",
      date: "December 31, 2024",
      time: "2 PM",
      l2Result: "23",
      d3Result: "712",
    },
  ]);

  const handleSaveResults = () => {
    // Add validation and save logic here
    console.log({
      schedule: selectedSchedule,
      l2Result,
      d3Result,
    });
  };

  const handleEditResult = (resultId: string) => {
    // Implement edit logic
    console.log("Editing result:", resultId);
  };

  const handleDeleteResult = (resultId: string) => {
    // Implement delete logic
    console.log("Deleting result:", resultId);
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView
        className="flex-1"
        onTouchStart={() => {
          // @ts-ignore
          TextInput.State?.blur?.();
        }}
      >
        <StyledView className="p-4">
          {/* Header */}
          <StyledView className="flex-row items-center justify-between mb-6">
            <StyledView className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <MaterialIcons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <ThemedText className="text-2xl font-bold">
                Add Draw Results
              </ThemedText>
            </StyledView>
            <TouchableOpacity
              className="bg-black px-4 py-2 rounded-lg"
              onPress={handleSaveResults}
            >
              <ThemedText className="text-white">Save Results</ThemedText>
            </TouchableOpacity>
          </StyledView>

          {/* Draw Schedule Section */}
          <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <ThemedText className="text-xl font-bold mb-4">
              Draw Schedule
            </ThemedText>
            <Dropdown
              data={drawSchedules}
              labelField="label"
              valueField="value"
              placeholder="Select draw date and time"
              value={selectedSchedule}
              onChange={(item) => setSelectedSchedule(item.value)}
              style={{
                height: 50,
                borderColor: "#E5E7EB",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
              }}
            />
          </StyledView>

          {/* Enter Results Section */}
          <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <ThemedText className="text-xl font-bold mb-4">
              Enter Results
            </ThemedText>
            <StyledView className="space-y-4">
              <StyledView>
                <ThemedText className="text-base mb-2">L2 Result</ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3"
                  placeholder="Enter Last 2 digits (00-99)"
                  value={l2Result}
                  onChangeText={setL2Result}
                  keyboardType="numeric"
                  maxLength={2}
                  blurOnSubmit={true}
                />
              </StyledView>
              <StyledView>
                <ThemedText className="text-base mb-2">3D Result</ThemedText>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3"
                  placeholder="Enter 3 digits (000-999)"
                  value={d3Result}
                  onChangeText={setD3Result}
                  keyboardType="numeric"
                  maxLength={3}
                  blurOnSubmit={true}
                />
              </StyledView>
            </StyledView>
          </StyledView>

          {/* Summary Section */}
          <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            <ThemedText className="text-xl font-bold mb-4">Summary</ThemedText>
            <StyledView className="space-y-2">
              <ThemedText>
                Date/Time:{" "}
                {selectedSchedule
                  ? drawSchedules.find((s) => s.value === selectedSchedule)
                      ?.label
                  : "Not selected"}
              </ThemedText>
              <ThemedText>L2 Result: {l2Result || "Not entered"}</ThemedText>
              <ThemedText>3D Result: {d3Result || "Not entered"}</ThemedText>
            </StyledView>
          </StyledView>

          {/* Draw Results History */}
          <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <ThemedText className="text-xl font-bold mb-4">
              Draw Results History
            </ThemedText>
            <StyledView className="space-y-3">
              {results.map((result) => (
                <StyledView
                  key={result.id}
                  className="flex-row justify-between items-center p-3 border border-gray-100 rounded-lg"
                >
                  <StyledView>
                    <ThemedText className="font-bold">
                      {result.date}, {result.time}
                    </ThemedText>
                    <ThemedText className="text-gray-600">
                      L2: {result.l2Result}, 3D: {result.d3Result}
                    </ThemedText>
                  </StyledView>
                  <StyledView className="flex-row">
                    <TouchableOpacity
                      onPress={() => handleEditResult(result.id)}
                      className="mr-2"
                    >
                      <MaterialIcons name="edit" size={24} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteResult(result.id)}
                    >
                      <MaterialIcons name="delete" size={24} color="#666" />
                    </TouchableOpacity>
                  </StyledView>
                </StyledView>
              ))}
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
