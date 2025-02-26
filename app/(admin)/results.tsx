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
import { useCurrentUser } from "@/hooks/useCurrentUser";

import { ThemedText } from "@/components/ThemedText";
import { DataTable } from "react-native-paper";

import Feather from "@expo/vector-icons/Feather";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface DrawResult {
  id: string;
  draw_date: string;
  draw_time: string;
  l2_result: string;
  d3_result: string;
  created_at: string;
  created_by: string;
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

const timeSchedules = [
  { label: "11 AM", value: "11:00:00" },
  { label: "5 PM", value: "17:00:00" },
  { label: "9 PM", value: "21:00:00" },
];

const verifyUserRole = async (userId: string) => {
  if (!userId) return null;

  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Role fetch error:", error);
    return null;
  }

  return userData?.role || null;
};

export default function ResultsScreen() {
  const { user } = useCurrentUser();
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
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [latestL2Result, setLatestL2Result] = useState<string | null>(null);
  const [latestD3Result, setLatestD3Result] = useState<string | null>(null);

  const timeOptions = [
    { label: "All", value: "" },
    { label: "11 AM", value: "11:00:00" },
    { label: "5 PM", value: "17:00:00" },
    { label: "9 PM", value: "21:00:00" },
  ];

  // Fetch results on component mount and when filters change
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
        const date = new Date(filterMonth);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        const selectedDate = date.toISOString().split("T")[0];
        query = query.eq("draw_date", selectedDate);
      }

      // Time filtering
      if (filterTime) {
        const timeValue = timeSchedules.find(
          (t) => t.label === filterTime
        )?.value;
        if (timeValue) {
          query = query.eq("draw_time", timeValue);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
      setLatestL2Result(data?.length > 0 ? data[0].l2_result : null);
      setLatestD3Result(data?.length > 0 ? data[0].d3_result : null);
    } catch (error) {
      console.error("Error fetching results:", error);
      Alert.alert("Error", "Failed to fetch results");
    }
  };

  // Add clear filters function
  const handleClearFilters = async () => {
    console.log("Clearing filters");
    setFilterMonth(null);
    setFilterTime("");
    setFilterDate("");

    // Fetch all results immediately after clearing filters
    try {
      const { data, error } = await supabase
        .from("draw_results")
        .select("*")
        .order("draw_date", { ascending: false })
        .order("draw_time", { ascending: false });

      if (error) {
        console.error("Error fetching results after clear:", error);
        Alert.alert("Error", "Failed to fetch results");
        return;
      }

      console.log("Fetched results after clear:", data);
      setResults(data || []);
      setLatestL2Result(data?.length > 0 ? data[0].l2_result : null);
      setLatestD3Result(data?.length > 0 ? data[0].d3_result : null);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const handleSaveResults = async () => {
    if (!selectedSchedule || !selectedTime || !l2Result || !d3Result) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      if (!user) {
        Alert.alert("Error", "You must be logged in to perform this action");
        return;
      }

      if (user.role !== "Admin") {
        Alert.alert(
          "Error",
          "You do not have permission to perform this action"
        );
        return;
      }

      // Check for existing draw result with same date and time
      const { data: existingDraws, error: checkError } = await supabase
        .from("draw_results")
        .select("*")
        .eq("draw_date", selectedSchedule)
        .eq("draw_time", selectedTime);

      if (checkError) {
        console.error("Error checking existing draws:", checkError);
        throw checkError;
      }

      // For updates, filter out the current record from the check
      const duplicateExists = isEditing
        ? existingDraws?.some(
            (draw) =>
              draw.id !== selectedId &&
              draw.draw_date === selectedSchedule &&
              draw.draw_time === selectedTime
          )
        : existingDraws?.length > 0;

      if (duplicateExists) {
        Alert.alert(
          "Duplicate Draw Result",
          `A draw result already exists for ${formatDate(
            new Date(selectedSchedule)
          )} at ${formatTimeTo12Hour(selectedTime)}.`
        );
        return;
      }

      const newResult = {
        draw_date: selectedSchedule,
        draw_time: selectedTime,
        l2_result: l2Result.padStart(2, "0"),
        d3_result: d3Result.padStart(3, "0"),
        created_by: user.id,
      };

      let response;
      if (isEditing && selectedId) {
        response = await supabase
          .from("draw_results")
          .update(newResult)
          .eq("id", selectedId)
          .select()
          .single();
      } else {
        response = await supabase
          .from("draw_results")
          .insert(newResult)
          .select()
          .single();
      }

      if (response.error) throw response.error;

      Alert.alert(
        "Success",
        `Draw result ${isEditing ? "updated" : "added"} successfully`,
        [
          {
            text: "OK",
            onPress: () => {
              setIsModalVisible(false);
              resetForm();
              fetchResults();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error saving draw result:", error);
      Alert.alert("Error", "Failed to save draw result");
    } finally {
      setIsLoading(false);
    }
  };

  // Add sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleEditResult = async (resultId: string) => {
    try {
      console.log("Fetching result with ID:", resultId);
      const { data: result, error } = await supabase
        .from("draw_results")
        .select("*")
        .eq("id", resultId)
        .single();

      if (error) {
        console.error("Error fetching result:", error);
        throw error;
      }

      console.log("Fetched result:", result);
      setIsEditing(true);
      setSelectedId(resultId);
      setSelectedSchedule(result.draw_date);
      setSelectedTime(result.draw_time);
      setL2Result(result.l2_result);
      setD3Result(result.d3_result);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error in handleEditResult:", error);
      Alert.alert("Error", "Failed to fetch result details");
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    Alert.alert(
      "Are you sure you want to delete this result?",
      "This action cannot be undone. This will permanently delete the draw result.",
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
              console.log("Attempting to delete result with ID:", resultId);
              const { error } = await supabase
                .from("draw_results")
                .delete()
                .eq("id", resultId);

              if (error) {
                console.error("Error deleting result:", error);
                throw error;
              }

              console.log("Successfully deleted result");
              await fetchResults();
              Alert.alert("Success", "Result deleted successfully");
            } catch (error) {
              console.error("Error in handleDeleteResult:", error);
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
      // Adjust the date for timezone
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setMinutes(
        adjustedDate.getMinutes() + adjustedDate.getTimezoneOffset()
      );

      console.log("Selected date:", {
        original: selectedDate,
        adjusted: adjustedDate,
        isoString: adjustedDate.toISOString(),
        dateOnly: adjustedDate.toISOString().split("T")[0],
      });

      setFilterMonth(adjustedDate);

      // Update the filterDate display
      const formattedDate = adjustedDate.toLocaleDateString("en-US", {
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

  const handleAddDateChange = (event: any, selectedDate?: Date) => {
    setShowAddDatePicker(false);
    if (selectedDate) {
      setSelectedSchedule(selectedDate.toISOString().split("T")[0]);
    }
  };

  // Remove the local filtering since we're doing it in the database
  const filteredResults = results;

  // Add this near your other state management functions
  const resetForm = () => {
    setSelectedSchedule("");
    setSelectedTime("");
    setL2Result("");
    setD3Result("");
    setIsEditing(false);
    setSelectedId(null);
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header Section */}
      <StyledView className="p-4">
        <StyledView className="flex-row items-center justify-between mb-6">
          <StyledView className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <MaterialIcons name="arrow-back" size={24} color="#6F13F5" />
            </TouchableOpacity>
            <ThemedText className="text-2xl font-bold text-[#6F13F5]">
              Draw Results
            </ThemedText>
          </StyledView>
          <TouchableOpacity
            className="bg-[#6F13F5] px-4 py-2 rounded-lg"
            onPress={() => setIsModalVisible(true)}
          >
            <ThemedText className="text-white">Add Result</ThemedText>
          </TouchableOpacity>
        </StyledView>

        {/* Date Navigation */}
        <StyledView className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-4">
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(filterMonth || new Date());
              newDate.setDate(newDate.getDate() - 1);
              setFilterMonth(newDate);
              setFilterDate(
                newDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              );
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#6F13F5" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-1 mx-4"
          >
            <ThemedText className="text-center text-[#6F13F5]">
              {filterDate || "Select Date"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(filterMonth || new Date());
              if (newDate < today) {
                newDate.setDate(newDate.getDate() + 1);
                setFilterMonth(newDate);
                setFilterDate(
                  newDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                );
              }
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#6F13F5" />
          </TouchableOpacity>
        </StyledView>

        {/* Latest Results Cards */}
        <StyledView className="flex-row mb-4 space-x-2">
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600 mb-1">
              Latest L2 Result
            </ThemedText>
            <ThemedText className="text-4xl font-bold text-[#6F13F5]">
              {latestL2Result || "--"}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600 mb-1">
              Latest 3D Result
            </ThemedText>
            <ThemedText className="text-4xl font-bold text-[#6F13F5]">
              {latestD3Result || "---"}
            </ThemedText>
          </StyledView>
        </StyledView>

        {/* Results Table */}
        <StyledView className="flex-1 bg-white rounded-lg shadow">
          <DataTable>
            <DataTable.Header style={{ backgroundColor: "#6F13F5" }}>
              <DataTable.Title style={{ flex: 1 }}>
                <ThemedText className="font-semibold text-white">
                  Time
                </ThemedText>
              </DataTable.Title>
              <DataTable.Title style={{ flex: 1 }}>
                <ThemedText className="font-semibold text-white">
                  L2 Result
                </ThemedText>
              </DataTable.Title>
              <DataTable.Title style={{ flex: 1 }}>
                <ThemedText className="font-semibold text-white">
                  3D Result
                </ThemedText>
              </DataTable.Title>
              <DataTable.Title style={{ flex: 1 }}>
                <ThemedText className="font-semibold text-white">
                  Actions
                </ThemedText>
              </DataTable.Title>
            </DataTable.Header>

            {filteredResults.map((result) => (
              <DataTable.Row key={result.id}>
                <DataTable.Cell style={{ flex: 1 }}>
                  <ThemedText>
                    {formatTimeTo12Hour(result.draw_time)}
                  </ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <ThemedText className="text-[#6F13F5] font-medium">
                    {result.l2_result}
                  </ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <ThemedText className="text-[#6F13F5] font-medium">
                    {result.d3_result}
                  </ThemedText>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <StyledView className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleEditResult(result.id)}
                    >
                      <Feather name="edit" size={20} color="#6F13F5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteResult(result.id)}
                    >
                      <MaterialIcons name="delete" size={20} color="#EF4040" />
                    </TouchableOpacity>
                  </StyledView>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </StyledView>
      </StyledView>

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
              <ThemedText className="text-xl font-bold text-[#6F13F5]">
                Edit Draw Result
              </ThemedText>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialIcons name="close" size={24} color="#6F13F5" />
              </TouchableOpacity>
            </StyledView>

            <ScrollView>
              <StyledView className="space-y-4">
                {/* Draw Schedule Section */}
                <StyledView className="space-y-4">
                  <ThemedText className="text-lg font-bold text-[#58508D]">
                    Draw Schedule
                  </ThemedText>
                  <StyledView>
                    <ThemedText className="text-base mb-2">Date</ThemedText>
                    <TouchableOpacity
                      className="flex-row justify-between items-center border border-gray-200 rounded-lg p-3"
                      onPress={() => setShowAddDatePicker(true)}
                    >
                      <ThemedText>
                        {selectedSchedule
                          ? formatDate(new Date(selectedSchedule))
                          : "Select date"}
                      </ThemedText>
                      <MaterialIcons
                        name="calendar-today"
                        size={20}
                        color="#6F13F5"
                      />
                    </TouchableOpacity>
                  </StyledView>

                  {showAddDatePicker && (
                    <DateTimePicker
                      value={
                        selectedSchedule
                          ? new Date(selectedSchedule)
                          : new Date()
                      }
                      mode="date"
                      display="default"
                      onChange={handleAddDateChange}
                    />
                  )}

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
                  <ThemedText className="text-lg font-bold text-[#58508D]">
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
                  <ThemedText className="text-lg font-bold text-[#58508D]">
                    Summary
                  </ThemedText>

                  <StyledView className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <StyledView className="space-y-3">
                      {/* Date/Time Card */}
                      <StyledView className="flex-row justify-between items-center">
                        <ThemedText className="text-gray-600">
                          Date - Time
                        </ThemedText>
                        <ThemedText className="font-medium text-[#6F13F5]">
                          {selectedSchedule
                            ? `${formatDate(new Date(selectedSchedule))}, ${
                                timeSchedules.find(
                                  (t) => t.value === selectedTime
                                )?.label || ""
                              }`
                            : "Not selected"}
                        </ThemedText>
                      </StyledView>

                      {/* Divider */}
                      <StyledView className="h-[1px] bg-gray-200" />

                      {/* L2 Result Card */}
                      <StyledView className="flex-row justify-between items-center">
                        <ThemedText className="text-gray-600">
                          L2 Result
                        </ThemedText>
                        <ThemedText
                          className={`font-medium ${
                            l2Result ? "text-[#6F13F5]" : "text-gray-400"
                          }`}
                        >
                          {l2Result || "Not entered"}
                        </ThemedText>
                      </StyledView>

                      {/* Divider */}
                      <StyledView className="h-[1px] bg-gray-200" />

                      {/* 3D Result Card */}
                      <StyledView className="flex-row justify-between items-center">
                        <ThemedText className="text-gray-600">
                          3D Result
                        </ThemedText>
                        <ThemedText
                          className={`font-medium ${
                            d3Result ? "text-[#6F13F5]" : "text-gray-400"
                          }`}
                        >
                          {d3Result || "Not entered"}
                        </ThemedText>
                      </StyledView>
                    </StyledView>
                  </StyledView>
                </StyledView>

                {/* Save Button */}
                <TouchableOpacity
                  className="bg-[#6F13F5] py-3 rounded-lg mt-4"
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
