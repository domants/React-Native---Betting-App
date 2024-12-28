//@ts-ignore
import { View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";

//icons
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

type FilterType = "All" | "Wins" | "Losses";

interface BetHistoryEntry {
  type: string;
  number: string;
  amount: string;
  result: "Win" | "Loss";
  winnings: string;
  date: string;
}

export default function BetHistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const historyData: BetHistoryEntry[] = [
    {
      type: "L2",
      number: "23",
      amount: "100",
      result: "Win",
      winnings: "200",
      date: "December 28, 2024",
    },
    {
      type: "3D",
      number: "456",
      amount: "200",
      result: "Loss",
      winnings: "0",
      date: "December 28, 2024",
    },
    {
      type: "L2",
      number: "78",
      amount: "150",
      result: "Win",
      winnings: "300",
      date: "December 28, 2024",
    },
  ];

  //filter data
  const filteredData = historyData.filter((entry) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Wins") return entry.result === "Win";
    if (activeFilter === "Losses") return entry.result === "Loss";
    return true;
  });

  const FilterTab = ({ title }: { title: FilterType }) => {
    const getButtonStyle = () => {
      switch (title) {
        case "All":
          return "bg-gray-400";
        case "Wins":
          return "bg-green-500";
        case "Losses":
          return "bg-rose-500";
      }
    };

    const getIcon = () => {
      switch (title) {
        case "Wins":
          return <FontAwesome name="trophy" size={15} color="#ffffff" />;
        case "Losses":
          return <FontAwesome name="close" size={15} color="#ffffff" />;
        default:
          return <FontAwesome5 name="list" size={15} color="#6F13F5" />;
      }
    };

    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(title)}
        className={`flex-1 py-3 ${getButtonStyle()} ${
          title === "All"
            ? "rounded-l-lg"
            : title === "Losses"
            ? "rounded-r-lg"
            : ""
        }`}
      >
        <StyledView className="flex-row justify-center items-center space-x-1">
          {getIcon()}
          <ThemedText className="text-[#ffffff] text-sm font-medium">
            {title}
          </ThemedText>
        </StyledView>
      </TouchableOpacity>
    );
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">
            Winning History
          </ThemedText>
        </StyledView>

        {/* Date Picker */}
        <TouchableOpacity
          className="flex-row items-center mb-4 p-4 bg-white rounded-lg border border-gray-200"
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons
            name="calendar-today"
            size={24}
            color="#6F13F5"
            className="mr-2"
          />
          <ThemedText className="text-base">
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

        {/* Filter Tabs */}
        <StyledView className="flex-row mb-4">
          <FilterTab title="All" />
          <FilterTab title="Wins" />
          <FilterTab title="Losses" />
        </StyledView>

        {/* History Cards */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {filteredData.map((entry, index) => (
            <StyledView
              key={index}
              className="bg-white p-4 rounded-lg border border-gray-200 mb-4"
            >
              <StyledView className="flex-row justify-between items-center mb-3">
                <ThemedText className="text-lg font-bold">
                  {entry.type} - {entry.number}
                </ThemedText>
                <ThemedText className="text-sm text-gray-500">
                  {entry.date}
                </ThemedText>
              </StyledView>

              <StyledView className="space-y-2">
                <StyledView className="flex-row">
                  <ThemedText className="text-gray-600">Amount: ₱</ThemedText>
                  <ThemedText>{entry.amount}</ThemedText>
                </StyledView>

                <StyledView className="flex-row">
                  <ThemedText className="text-gray-600">Result: </ThemedText>
                  <ThemedText
                    className={
                      entry.result === "Win" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {entry.result}
                  </ThemedText>
                </StyledView>

                <StyledView className="flex-row">
                  <ThemedText className="text-gray-600">Winnings: ₱</ThemedText>
                  <ThemedText>{entry.winnings}</ThemedText>
                </StyledView>
              </StyledView>
            </StyledView>
          ))}
        </ScrollView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
