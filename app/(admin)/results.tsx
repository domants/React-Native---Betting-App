import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
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

// get today's date
const today = new Date();
const dateToday = new Date(today);
dateToday.setDate(dateToday.getDate());

const drawSchedules = [
  {
    label: formatDate(dateToday),
    value: dateToday.toISOString().split("T")[0],
  },
];

const timeSchedules = [
  { label: "11 AM", value: "11:00" },
  { label: "5 PM", value: "17:00" },
  { label: "9 PM", value: "21:00" },
];

export default function ResultsScreen() {
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [l2Result, setL2Result] = useState("");
  const [d3Result, setD3Result] = useState("");
  const [results, setResults] = useState<DrawResult[]>([
    {
      id: "1",
      date: formatDate(dateToday),
      time: "11 AM",
      l2Result: "23",
      d3Result: "712",
    },
  ]);
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date());
  const scrollViewRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const timeOptions = [
    { label: "All", value: "" },
    { label: "11 AM", value: "11 AM" },
    { label: "5 PM", value: "5 PM" },
    { label: "9 PM", value: "9 PM" },
  ];

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedSchedule("");
    setSelectedTime("");
    setL2Result("");
    setD3Result("");
  };

  const handleSaveResults = () => {
    if (!selectedSchedule || !selectedTime || !l2Result || !d3Result) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const selectedDraw = drawSchedules.find(
      (s) => s.value === selectedSchedule
    );
    const selectedTimeOption = timeSchedules.find(
      (t) => t.value === selectedTime
    );

    if (!selectedDraw || !selectedTimeOption) return;

    const newResult: DrawResult = {
      id: Date.now().toString(),
      date: selectedDraw.label,
      time: selectedTimeOption.label,
      l2Result,
      d3Result,
    };

    setResults((prev) => {
      // Check if we're editing an existing result
      const existingResultIndex = prev.findIndex(
        (r) => r.date === newResult.date && r.time === newResult.time
      );

      if (existingResultIndex >= 0) {
        // Update existing result
        const updatedResults = [...prev];
        updatedResults[existingResultIndex] = newResult;
        return updatedResults;
      } else {
        // Add new result
        return [newResult, ...prev];
      }
    });

    handleCloseModal();

    Alert.alert("Success", "Results saved successfully");
  };

  const handleEditResult = (resultId: string) => {
    const resultToEdit = results.find((r) => r.id === resultId);
    if (!resultToEdit) return;

    // Find matching schedule and time options
    const matchingSchedule = drawSchedules.find(
      (s) => s.label === resultToEdit.date
    );
    const matchingTime = timeSchedules.find(
      (t) => t.label === resultToEdit.time
    );

    if (matchingSchedule && matchingTime) {
      setSelectedSchedule(matchingSchedule.value);
      setSelectedTime(matchingTime.value);
      setL2Result(resultToEdit.l2Result);
      setD3Result(resultToEdit.d3Result);
    }

    // Scroll to top to show the form
    // @ts-ignore
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    setIsModalVisible(true);
  };

  const handleDeleteResult = (resultId: string) => {
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this result?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setResults((prev) =>
              prev.filter((result) => result.id !== resultId)
            );
          },
        },
      ]
    );
  };

  const handleMonthChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterMonth(selectedDate);
      setFilterDate(
        selectedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    }
  };

  const filteredResults = results.filter((result) => {
    console.log(result);
    if (!filterDate) return true;

    return result.date === filterDate;
  });

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView
        ref={scrollViewRef}
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
              onPress={() => setIsModalVisible(true)}
            >
              <ThemedText className="text-white">Add Result</ThemedText>
            </TouchableOpacity>
          </StyledView>

          {/* Draw Results History with Filters */}
          <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <StyledView className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-xl font-bold">
                Draw Results History
              </ThemedText>
              <TouchableOpacity
                className="flex-row items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg"
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color="#000" />
                <ThemedText>Pick a month</ThemedText>
              </TouchableOpacity>
            </StyledView>

            {showDatePicker && (
              <DateTimePicker
                value={filterMonth}
                mode="date"
                display="default"
                onChange={handleMonthChange}
              />
            )}

            {/* Results List */}
            <StyledView className="space-y-3">
              {filteredResults.length === 0 ? (
                <ThemedText className="text-gray-500 text-center py-2">
                  No results found for this date
                </ThemedText>
              ) : (
                filteredResults.map((result) => (
                  <StyledView
                    key={result.id}
                    className="flex-row justify-between items-center"
                  >
                    <StyledView className="space-y-2">
                      <ThemedText className="text-lg font-bold">
                        {result.date}
                      </ThemedText>
                      <ThemedText className="text-gray-500">
                        Time: {result.time}
                      </ThemedText>
                      <ThemedText>L2: {result.l2Result}</ThemedText>
                      <ThemedText>3D: {result.d3Result}</ThemedText>
                    </StyledView>
                    <StyledView className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleEditResult(result.id)}
                      >
                        <MaterialIcons
                          name="edit"
                          size={24}
                          color="blue"
                          className="mr-2"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteResult(result.id)}
                      >
                        <MaterialIcons name="delete" size={24} color="red" />
                      </TouchableOpacity>
                    </StyledView>
                  </StyledView>
                ))
              )}
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Add/Edit Result Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        useNativeDriver
        style={{ margin: 0 }}
      >
        <StyledView className="flex-1 bg-black/50 justify-center">
          <StyledView className="bg-white mx-4 rounded-xl p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-xl font-bold">
                Add Draw Result
              </ThemedText>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </StyledView>

            <ScrollView>
              <StyledView className="space-y-4">
                {/* Draw Schedule Section */}
                <StyledView className="space-y-4">
                  <ThemedText className="text-lg font-bold">
                    Draw Schedule
                  </ThemedText>
                  <StyledView>
                    <ThemedText className="text-base mb-2">Date</ThemedText>
                    <Dropdown
                      data={drawSchedules}
                      labelField="label"
                      valueField="value"
                      placeholder="Select draw date"
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
                  <StyledView>
                    <ThemedText className="text-base mb-2">Time</ThemedText>
                    <Dropdown
                      data={timeSchedules}
                      labelField="label"
                      valueField="value"
                      placeholder="Select draw time"
                      value={selectedTime}
                      onChange={(item) => setSelectedTime(item.value)}
                      style={{
                        height: 50,
                        borderColor: "#E5E7EB",
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                      }}
                    />
                  </StyledView>
                </StyledView>

                {/* Enter Results Section */}
                <StyledView className="space-y-4">
                  <ThemedText className="text-lg font-bold">
                    Enter Results
                  </ThemedText>
                  <StyledView>
                    <ThemedText className="text-base mb-2">
                      L2 Result
                    </ThemedText>
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
                    <ThemedText className="text-base mb-2">
                      3D Result
                    </ThemedText>
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

                {/* Summary Section */}
                <StyledView className="space-y-2">
                  <ThemedText className="text-lg font-bold">Summary</ThemedText>
                  <ThemedText>
                    Date/Time:{" "}
                    {selectedSchedule
                      ? `${
                          drawSchedules.find(
                            (s) => s.value === selectedSchedule
                          )?.label
                        }, ${
                          timeSchedules.find((t) => t.value === selectedTime)
                            ?.label || ""
                        }`
                      : "Not selected"}
                  </ThemedText>
                  <ThemedText>
                    L2 Result: {l2Result || "Not entered"}
                  </ThemedText>
                  <ThemedText>
                    3D Result: {d3Result || "Not entered"}
                  </ThemedText>
                </StyledView>

                {/* Save Button */}
                <TouchableOpacity
                  className="bg-black py-3 rounded-lg mt-4"
                  onPress={handleSaveResults}
                >
                  <ThemedText className="text-white text-center font-semibold">
                    Save Result
                  </ThemedText>
                </TouchableOpacity>
              </StyledView>
            </ScrollView>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledSafeAreaView>
  );
}
