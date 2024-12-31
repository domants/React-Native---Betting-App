import { View, TouchableOpacity, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface Bet {
  id: string;
  amount: string;
  type: string;
  time: string;
  status: string;
  date: Date;
  placedBy: string;
  role: string;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function ViewBetsScreen() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState("Dec 31, 2024 - Dec 31, 2024");

  const getRoleOptions = () => {
    const baseOption = [{ label: "All Roles", value: "" }];

    if (user?.role === "coordinator") {
      return [
        ...baseOption,
        { label: "Sub-Coordinator", value: "Sub-Coordinator" },
        { label: "Usher", value: "Usher" },
      ];
    }

    if (user?.role === "sub_coordinator") {
      return [...baseOption, { label: "Usher", value: "Usher" }];
    }

    return baseOption;
  };

  const roleOptions = getRoleOptions();

  // Mock data
  const bets: Bet[] = [
    {
      id: "1",
      amount: "₱100",
      type: "L2",
      time: "10:30 AM",
      status: "Won",
      date: new Date(),
      placedBy: "John Doe",
      role: "Sub-Coordinator",
    },
    {
      id: "2",
      amount: "₱150",
      type: "3D",
      time: "11:45 AM",
      status: "Lost",
      date: new Date(),
      placedBy: "John Doe",
      role: "Usher",
    },
    {
      id: "3",
      amount: "₱200",
      type: "L2",
      time: "2:15 PM",
      status: "Pending",
      date: new Date(),
      placedBy: "John Doe",
      role: "Sub-Coordinator",
    },
  ];

  // Apply filters using useMemo
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      // Filter by search query (ID)
      const matchesSearch = searchQuery
        ? bet.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Filter by role
      const matchesRole = selectedRole ? bet.role === selectedRole : true;

      // Filter by date
      const matchesDate = isSameDay(new Date(bet.date), selectedDate);

      return matchesSearch && matchesRole && matchesDate;
    });
  }, [bets, searchQuery, selectedRole, selectedDate]);

  // Calculate summary statistics from filtered bets
  const summaryStats = useMemo(() => {
    return {
      totalBets: filteredBets.length,
      totalAmount: filteredBets.reduce(
        (sum, bet) =>
          sum + parseInt(bet.amount.replace("₱", "").replace(",", "")),
        0
      ),
      totalPotentialWinnings: filteredBets.reduce(
        (sum, bet) =>
          sum +
          (bet.status === "Won"
            ? parseInt(bet.amount.replace("₱", "").replace(",", ""))
            : 0),
        0
      ),
    };
  }, [filteredBets]);

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <StyledView className="p-4 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText className="text-xl font-bold">View Bets</ThemedText>
      </StyledView>

      <ScrollView className="flex-1 p-4">
        {/* Summary Cards */}
        <StyledView className="flex-row space-x-4 mb-4">
          <StyledView className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <ThemedText className="text-gray-600">Total Bets</ThemedText>
            <ThemedText className="text-2xl font-bold">
              {summaryStats.totalBets}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <ThemedText className="text-gray-600">Total Amount Bet</ThemedText>
            <ThemedText className="text-2xl font-bold">
              ₱{summaryStats.totalAmount}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 bg-white p-4 rounded-lg shadow-sm">
            <ThemedText className="text-gray-600">
              Total Potential Winnings
            </ThemedText>
            <ThemedText className="text-2xl font-bold">
              ₱{summaryStats.totalPotentialWinnings}
            </ThemedText>
          </StyledView>
        </StyledView>

        {/* Filters */}
        <StyledView className="mb-4">
          {/* Date Range */}
          <TouchableOpacity className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
            <ThemedText>{dateRange}</ThemedText>
          </TouchableOpacity>

          {/* Role Dropdown and Search */}
          <StyledView className="flex-row space-x-2">
            <Dropdown
              data={roleOptions}
              labelField="label"
              valueField="value"
              placeholder="All Roles"
              value={selectedRole}
              onChange={(item) => setSelectedRole(item.value)}
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
            <TextInput
              className="flex-1 bg-white p-2 rounded-lg border border-gray-200"
              placeholder="Search by number or name"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </StyledView>
        </StyledView>

        {/* Bet List */}
        <StyledView className="bg-white rounded-lg p-4">
          <StyledView className="flex-row justify-between items-center mb-4">
            <ThemedText className="text-lg font-bold">Bet List</ThemedText>
            <TouchableOpacity
              className="bg-black px-4 py-2 rounded-lg"
              onPress={() => {}}
            >
              <ThemedText className="text-white">Export PDF</ThemedText>
            </TouchableOpacity>
          </StyledView>

          {/* Table Header */}
          <StyledView className="flex-row border-b border-gray-200 pb-2 mb-2">
            <ThemedText className="w-16 font-semibold">ID</ThemedText>
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
      </ScrollView>
    </StyledSafeAreaView>
  );
}
