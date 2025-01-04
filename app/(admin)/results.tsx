import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import Modal from "react-native-modal";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";

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
function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Helper function to convert 24h time to 12h format
function formatTimeTo12Hour(time24: string): string {
  const [hours] = time24.split(":");
  const hour = parseInt(hours, 10);

  if (hour === 11) return "11 AM";
  if (hour === 17) return "5 PM";
  if (hour === 21) return "9 PM";
  return time24; // fallback
}

// Helper function to convert 12h time to 24h format
function formatTimeTo24Hour(time12: string): string {
  if (time12 === "11 AM") return "11:00:00";
  if (time12 === "5 PM") return "17:00:00";
  if (time12 === "9 PM") return "21:00:00";
  return time12; // fallback
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
  { label: "11 AM", value: "11:00:00" },
  { label: "5 PM", value: "17:00:00" },
  { label: "9 PM", value: "21:00:00" },
];

export default function ResultsScreen() {
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [l2Result, setL2Result] = useState("");
  const [d3Result, setD3Result] = useState("");
  const [results, setResults] = useState<DrawResult[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterMonth, setFilterMonth] = useState<Date | null>(null);
  const scrollViewRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = [
    { label: "All", value: "" },
    { label: "11 AM", value: "11:00:00" },
    { label: "5 PM", value: "17:00:00" },
    { label: "9 PM", value: "21:00:00" },
  ];

  // Fetch results on component mount
  useEffect(() => {
    fetchResults();
  }, [filterMonth, filterTime]);

  const fetchResults = async () => {
    try {
      let query = supabase
        .from("draw_results")
        .select("*")
        .order("draw_date", { ascending: false })
        .order("draw_time", { ascending: false });

      // Date filtering
      if (filterMonth) {
        const selectedDate = filterMonth.toISOString().split("T")[0];
        console.log("Selected date for filtering:", selectedDate);
        query = query.eq("draw_date", selectedDate);
      }

      // Time filtering
      if (filterTime && filterTime !== "All") {
        const timeValue = timeSchedules.find(
          (t) => t.label === filterTime
        )?.value;
        if (timeValue) {
          query = query.eq("draw_time", timeValue);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching results:", error);
        Alert.alert("Error", "Failed to fetch results");
        return;
      }

      console.log("Fetched results:", data);
      setResults(data || []);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  // Add clear filters function
  const handleClearFilters = () => {
    setFilterMonth(null);
    setFilterTime("");
    setFilterDate("");
    fetchResults();
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedSchedule("");
    setSelectedTime("");
    setL2Result("");
    setD3Result("");
    setIsEditing(false);
    setSelectedId(null);
  };

  const handleSaveResults = async () => {
    if (!selectedSchedule || !selectedTime || !l2Result || !d3Result) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      const newResult = {
        draw_date: selectedSchedule,
        draw_time: selectedTime,
        l2_result: l2Result.padStart(2, "0"),
        d3_result: d3Result.padStart(3, "0"),
        ...(isEditing && { id: selectedId }),
      };

      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from("draw_results")
          .update(newResult)
          .eq("id", selectedId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("draw_results")
          .insert([newResult]);
        error = insertError;
      }

      if (error) throw error;

      handleCloseModal();
      fetchResults();
      Alert.alert(
        "Success",
        `Results ${isEditing ? "updated" : "saved"} successfully`
      );
    } catch (error) {
      console.error("Error saving results:", error);
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "save"} results`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditResult = async (resultId: string) => {
    try {
      const { data: result, error } = await supabase
        .from("draw_results")
        .select("*")
        .eq("id", resultId)
        .single();

      if (error) throw error;

      setIsEditing(true);
      setSelectedId(resultId);
      setSelectedSchedule(result.draw_date);
      setSelectedTime(result.draw_time);
      setL2Result(result.l2_result);
      setD3Result(result.d3_result);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching result:", error);
      Alert.alert("Error", "Failed to fetch result details");
    }
  };

  const handleDeleteResult = async (resultId: string) => {
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
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("draw_results")
                .delete()
                .eq("id", resultId);

              if (error) throw error;

              fetchResults();
              Alert.alert("Success", "Result deleted successfully");
            } catch (error) {
              console.error("Error deleting result:", error);
              Alert.alert("Error", "Failed to delete result");
            }
          },
        },
      ]
    );
  };

  const handleMonthChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      console.log("Selected date in handleMonthChange:", selectedDate); // Debug log
      setFilterMonth(selectedDate);

      // Update the filterDate display
      const formattedDate = selectedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setFilterDate(formattedDate);
    }
  };

  const handleTimeFilter = (item: { label: string; value: string }) => {
    setFilterTime(item.label === "All" ? "" : item.label);
  };

  // Remove the local filtering since we're doing it in the database
  const filteredResults = results;

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
            <ThemedText className="text-xl font-bold mb-4">
              Draw Results History
            </ThemedText>

            {/* Filters in center */}
            <StyledView className="space-y-4">
              <StyledView className="flex-row justify-center items-center space-x-4 mb-6 border-b border-gray-200 pb-4">
                <TouchableOpacity
                  className="flex-1 flex-row justify-center items-center space-x-2 bg-gray-100 py-2 rounded-lg"
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color="#000" />
                  <ThemedText>{filterDate || "Pick a date"}</ThemedText>
                </TouchableOpacity>
                <Dropdown
                  data={timeOptions}
                  labelField="label"
                  valueField="label"
                  placeholder="All"
                  value={filterTime}
                  onChange={handleTimeFilter}
                  style={{
                    flex: 1,
                    height: 36,
                    borderColor: "#E5E7EB",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    backgroundColor: "#F3F4F6",
                  }}
                />
              </StyledView>

              {/* Add Clear Filters button */}
              {(filterMonth || filterTime) && (
                <TouchableOpacity
                  className="flex-row justify-center items-center bg-gray-200 py-2 rounded-lg mb-4"
                  onPress={handleClearFilters}
                >
                  <MaterialIcons
                    name="clear"
                    size={20}
                    color="#000"
                    className="mr-2"
                  />
                  <ThemedText>Clear Filters</ThemedText>
                </TouchableOpacity>
              )}
            </StyledView>

            {showDatePicker && (
              <DateTimePicker
                value={filterMonth || new Date()}
                mode="date"
                display="default"
                onChange={handleMonthChange}
              />
            )}

            {/* Results List with Cards */}
            <StyledView className="space-y-4">
              {filteredResults.length === 0 ? (
                <ThemedText className="text-gray-500 text-center py-2">
                  No results found for this date
                </ThemedText>
              ) : (
                filteredResults.map((result) => (
                  <StyledView
                    key={result.id}
                    className="flex-row justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100"
                  >
                    <StyledView className="space-y-2">
                      <ThemedText className="text-lg font-bold">
                        {formatDate(new Date(result.draw_date))}
                      </ThemedText>
                      <ThemedText className="text-gray-500">
                        Time: {formatTimeTo12Hour(result.draw_time)}
                      </ThemedText>
                      <ThemedText>L2: {result.l2_result}</ThemedText>
                      <ThemedText>3D: {result.d3_result}</ThemedText>
                    </StyledView>
                    <StyledView className="flex-row items-center space-x-3">
                      <TouchableOpacity
                        onPress={() => handleEditResult(result.id)}
                      >
                        <MaterialIcons name="edit" size={24} color="blue" />
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
