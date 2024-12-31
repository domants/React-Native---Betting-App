import { View, TouchableOpacity, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
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

interface Bet {
  id: string;
  user: string;
  amount: string;
  type: string;
  time: string;
  status: string;
}

export default function DailyBetsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const typeOptions = [
    { label: "All Types", value: "" },
    { label: "L2", value: "L2" },
    { label: "3D", value: "3D" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Won", value: "Won" },
    { label: "Lost", value: "Lost" },
    { label: "Pending", value: "Pending" },
  ];

  //prettier-ignore
  const bets = [
    { id: "1", user: "Coordinator1", amount: "₱100", type: "L2", time: "10:00 AM", status: "Won" },
    { id: "2", user: "SubCoordinator1", amount: "₱50", type: "3D", time: "11:30 AM", status: "Lost" },
    { id: "3", user: "Usher1", amount: "₱75", type: "L2", time: "2:00 PM", status: "Pending" },
    { id: "4", user: "Coordinator2", amount: "₱200", type: "3D", time: "9:15 AM", status: "Won" },
    { id: "5", user: "SubCoordinator2", amount: "₱150", type: "L2", time: "12:45 PM", status: "Lost" },
    { id: "6", user: "Usher2", amount: "₱125", type: "L2", time: "3:30 PM", status: "Pending" },
    { id: "7", user: "Coordinator3", amount: "₱300", type: "3D", time: "8:00 AM", status: "Won" },
    { id: "8", user: "SubCoordinator3", amount: "₱175", type: "L2", time: "10:50 AM", status: "Lost" },
    { id: "9", user: "Usher3", amount: "₱95", type: "L2", time: "1:15 PM", status: "Pending" },
    { id: "10", user: "Coordinator4", amount: "₱250", type: "3D", time: "4:45 PM", status: "Won" },
    { id: "11", user: "SubCoordinator4", amount: "₱110", type: "L2", time: "5:30 PM", status: "Lost" },
    { id: "12", user: "Usher4", amount: "₱80", type: "L2", time: "6:00 PM", status: "Pending" },
    { id: "13", user: "Coordinator5", amount: "₱180", type: "3D", time: "7:00 AM", status: "Won" },
  ];

  // const filteredBets = bets.filter((bet) => {
  //   const matchesSearch = searchQuery
  //     ? bet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       bet.user.toLowerCase().includes(searchQuery.toLowerCase())
  //     : true;

  //   const matchesType = selectedType ? bet.type === selectedType : true;

  //   const matchesStatus = selectedStatus ? bet.status === selectedStatus : true;

  //   return matchesSearch && matchesType && matchesStatus;
  // });

  //removed users search from the filter
  const filteredBets = bets.filter((bet) => {
    const matchesSearch = searchQuery
      ? bet.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesType = selectedType ? bet.type === selectedType : true;

    const matchesStatus = selectedStatus ? bet.status === selectedStatus : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalBets = filteredBets.length;
  const totalAmount = filteredBets.reduce(
    (sum, bet) => sum + parseInt(bet.amount.replace("₱", "")),
    0
  );
  const totalWinnings = filteredBets
    .filter((bet) => bet.status === "Won")
    .reduce((sum, bet) => sum + parseInt(bet.amount.replace("₱", "")), 0);

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <StyledView className="p-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText className="text-xl font-bold">View Bets Per Day</ThemedText>
      </StyledView>

      <ScrollView className="flex-1">
        <StyledView className="p-4">
          {/* Stats Cards */}
          <StyledView className="flex-row justify-between mb-4">
            <StyledView className="flex-1 bg-white p-4 rounded-lg mr-2">
              <ThemedText className="text-gray-600 mb-1">Total Bets</ThemedText>
              <ThemedText className="text-2xl font-bold">
                {totalBets}
              </ThemedText>
            </StyledView>
            <StyledView className="flex-1 bg-white p-4 rounded-lg mx-2">
              <ThemedText className="text-gray-600 mb-1">
                Total Amount Wagered
              </ThemedText>
              <ThemedText className="text-2xl font-bold">
                ₱{totalAmount}
              </ThemedText>
            </StyledView>
            <StyledView className="flex-1 bg-white p-4 rounded-lg ml-2">
              <ThemedText className="text-gray-600 mb-1">
                Total Winnings Paid
              </ThemedText>
              <ThemedText className="text-2xl font-bold">
                ₱{totalWinnings}
              </ThemedText>
            </StyledView>
          </StyledView>

          {/* Filters */}
          <StyledView className="mb-4">
            <TextInput
              className="bg-white p-3 rounded-lg border border-gray-200 mb-2"
              placeholder="Search by ID or User"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <StyledView className="flex-row space-x-2">
              <Dropdown
                data={typeOptions}
                labelField="label"
                valueField="value"
                placeholder="All Types"
                value={selectedType}
                onChange={(item) => setSelectedType(item.value)}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "white",
                  borderRadius: 8,
                  borderColor: "#E5E7EB",
                  borderWidth: 1,
                  paddingHorizontal: 8,
                }}
              />
              <Dropdown
                data={statusOptions}
                labelField="label"
                valueField="value"
                placeholder="All Statuses"
                value={selectedStatus}
                onChange={(item) => setSelectedStatus(item.value)}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "white",
                  borderRadius: 8,
                  borderColor: "#E5E7EB",
                  borderWidth: 1,
                  paddingHorizontal: 8,
                }}
              />
            </StyledView>
          </StyledView>

          {/* Bet List */}
          <StyledView className="bg-white rounded-lg p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-lg font-bold">Bet List</ThemedText>
              <TouchableOpacity className="bg-gray-100 px-4 py-2 rounded-lg">
                <ThemedText>Export</ThemedText>
              </TouchableOpacity>
            </StyledView>

            {/* Table Header */}
            <StyledView className="flex-row border-b border-gray-200 pb-2 mb-2">
              <ThemedText className="w-16 font-semibold">ID</ThemedText>
              <ThemedText className="flex-1 font-semibold">User</ThemedText>
              <ThemedText className="w-24 font-semibold">Amount</ThemedText>
              <ThemedText className="w-16 font-semibold">Type</ThemedText>
              <ThemedText className="w-24 font-semibold">Time</ThemedText>
              <ThemedText className="w-20 font-semibold">Status</ThemedText>
            </StyledView>

            {/* Table Content */}
            {filteredBets.map((bet) => (
              <StyledView
                key={bet.id}
                className="flex-row py-3 border-b border-gray-100"
              >
                <ThemedText className="w-16">{bet.id}</ThemedText>
                <ThemedText className="flex-1">{bet.user}</ThemedText>
                <ThemedText className="w-24">{bet.amount}</ThemedText>
                <ThemedText className="w-16">{bet.type}</ThemedText>
                <ThemedText className="w-24">{bet.time}</ThemedText>
                <ThemedText
                  className={`w-20 ${
                    bet.status === "Won"
                      ? "text-green-600"
                      : bet.status === "Lost"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {bet.status}
                </ThemedText>
              </StyledView>
            ))}
          </StyledView>
        </StyledView>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
