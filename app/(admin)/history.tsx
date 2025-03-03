import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, Text, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedView } from "@/components/ThemedView";
import { StyledScrollView } from "@/components/StyledScrollView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledModal = styled(Modal);

type BetFilter = "all" | "last_two" | "swertres" | "wins" | "losses";
type GameFilter = "ALL" | "LAST TWO" | "SWERTRES";
type GameType = "all" | "l2" | "swertres";

export interface BetHistory {
  id: string;
  user_id: string;
  combination: string;
  amount: number;
  is_rumble: boolean;
  game_title: string;
  draw_time: string;
  bet_date: string;
  status?: string;
  winningAmount?: number;
  users: {
    name: string;
  } | null;
}

interface WinningHistory {
  id: string;
  ticket_number: string;
  contact_number: string;
  game_title: string;
  bet_combination: string;
  winning_combination: string;
  bet_amount: number;
  winning_amount: number;
  draw_date: string;
  draw_time: string;
  users: { name: string };
}

function formatDrawTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);

  if (hour === 11) return "11 AM";
  if (hour === 17) return "5 PM";
  if (hour === 21) return "9 PM";

  // Fallback format if time doesn't match expected values
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${ampm}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Add this interface for the modal state
interface DetailsModalState {
  isVisible: boolean;
  winning?: WinningHistory;
}

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "l2" | "swertres">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Add user role check
  const [userRole, setUserRole] = useState<string | null>(null);

  // First, add these state variables
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  // First, add state for the game dropdown
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<
    "all" | "l2" | "swertres"
  >("all");

  // Add state for the modal
  const [detailsModal, setDetailsModal] = useState<DetailsModalState>({
    isVisible: false,
  });

  // Check user role on mount
  useEffect(() => {
    async function checkUserRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert("Error", "You must be logged in to view this page");
          router.replace("/(auth)/login");
          return;
        }

        // Get user role from users table
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !userData) {
          throw error || new Error("No user data found");
        }

        setUserRole(userData.role);

        // Redirect non-admin users
        if (userData.role !== "Admin") {
          Alert.alert(
            "Access Denied",
            "You do not have permission to view this page"
          );
          router.back();
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        Alert.alert("Error", "Failed to verify user permissions");
        router.back();
      } finally {
        setIsLoading(false);
      }
    }

    checkUserRole();
  }, []);

  // Fetch winnings data
  const { data: winnings = [], isLoading: isWinningsLoading } = useQuery({
    queryKey: [
      "winnings",
      selectedDate.toISOString().split("T")[0],
      activeFilter,
    ],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data: winningsData, error } = await supabase
        .from("winnings")
        .select(
          `
          *,
          users:user_id (
            name
          )
        `
        )
        .eq("draw_date", dateStr);

      if (error) {
        console.error("Error fetching winnings:", error);
        throw error;
      }

      return winningsData as WinningHistory[];
    },
  });

  // Filter winnings based on game type
  const filteredWinnings = winnings.filter((winning) => {
    switch (selectedGameType) {
      case "l2":
        return winning.game_title === "LAST TWO";
      case "swertres":
        return winning.game_title === "SWERTRES";
      default:
        return true;
    }
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  if (isLoading || isWinningsLoading) {
    return <LoadingSpinner />;
  }

  // If not admin, don't render anything (they should be redirected)
  if (userRole !== "Admin") {
    return null;
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        {/* Header with Back Button */}
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedView className="flex-1 items-center">
            <ThemedText className="text-xl font-bold">
              Winning History
            </ThemedText>
          </ThemedView>
          <StyledView className="w-10" /> {/* Spacer */}
        </StyledView>

        {/* Date Navigation */}
        <StyledView className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              setSelectedDate(newDate);
            }}
          >
            <ThemedView className="flex-row items-center">
              <MaterialIcons name="chevron-left" size={24} color="#000" />
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-6 py-2 rounded-lg border border-gray-200"
          >
            <ThemedText>{formatDate(selectedDate)}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              setSelectedDate(newDate);
            }}
          >
            <ThemedView className="flex-row items-center">
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </ThemedView>
          </TouchableOpacity>
        </StyledView>

        {/* Game Type Filter Button */}
        <TouchableOpacity
          onPress={() => setShowGameDropdown(!showGameDropdown)}
          className="mb-4 bg-white p-3 rounded-lg flex-row justify-between items-center border border-gray-200"
        >
          <ThemedText>
            {selectedGameType === "all"
              ? "All Games"
              : selectedGameType === "l2"
              ? "Last Two"
              : "Swertres"}
          </ThemedText>
          <MaterialIcons
            name={
              showGameDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"
            }
            size={24}
            color="#666"
          />
        </TouchableOpacity>

        {/* Table Header */}
        <StyledView className="flex-row py-2 border-b border-gray-200">
          <ThemedText className="w-[25%] font-semibold">Ticket No.</ThemedText>
          <ThemedText className="w-[30%] font-semibold">Bettor</ThemedText>
          <ThemedText className="w-[25%] font-semibold text-right">
            Amount
          </ThemedText>
          <ThemedText className="w-[20%] font-semibold text-center">
            Action
          </ThemedText>
        </StyledView>

        {/* Winnings List as Table */}
        <StyledScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          {filteredWinnings.length > 0 ? (
            filteredWinnings.map((winning) => (
              <StyledView
                key={winning.id}
                className="flex-row py-3 border-b border-gray-100 items-center"
              >
                <ThemedText className="w-[25%]" numberOfLines={1}>
                  {winning.ticket_number}
                </ThemedText>
                <ThemedText className="w-[30%]" numberOfLines={1}>
                  {winning.users?.name}
                </ThemedText>
                <ThemedText className="w-[25%] text-right">
                  ₱{winning.bet_amount}
                </ThemedText>
                <StyledView className="w-[20%] items-center">
                  <TouchableOpacity
                    className="bg-[#6F13F5] px-3 py-1 rounded-lg"
                    onPress={() =>
                      setDetailsModal({ isVisible: true, winning })
                    }
                  >
                    <ThemedText className="text-white text-sm">
                      Details
                    </ThemedText>
                  </TouchableOpacity>
                </StyledView>
              </StyledView>
            ))
          ) : (
            <ThemedView className="flex-1 justify-center items-center py-8">
              <MaterialIcons name="emoji-events" size={48} color="#ccc" />
              <ThemedText className="text-gray-400 mt-4 text-center">
                No winning history found for this date
              </ThemedText>
            </ThemedView>
          )}
        </StyledScrollView>

        {/* Dropdown Menu */}
        {showGameDropdown && (
          <ThemedView className="absolute top-[200] left-4 right-4 z-10 bg-white rounded-lg shadow-lg">
            {[
              { id: "all", label: "All Games" },
              { id: "l2", label: "Last Two" },
              { id: "swertres", label: "Swertres" },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setSelectedGameType(option.id as "all" | "l2" | "swertres");
                  setShowGameDropdown(false);
                }}
                className={`p-4 border-b border-gray-100 ${
                  selectedGameType === option.id ? "bg-gray-50" : ""
                }`}
              >
                <ThemedText
                  className={
                    selectedGameType === option.id
                      ? "text-[#6F13F5]"
                      : "text-gray-600"
                  }
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </StyledView>

      {/* Details Modal */}
      <StyledModal
        animationType="fade"
        transparent={true}
        visible={detailsModal.isVisible}
        onRequestClose={() => setDetailsModal({ isVisible: false })}
      >
        <StyledView className="flex-1 bg-black/50 justify-center items-center">
          <StyledView className="bg-white w-[90%] rounded-xl p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-xl font-bold">
                Winning Bet Details
              </ThemedText>
              <TouchableOpacity
                onPress={() => setDetailsModal({ isVisible: false })}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </StyledView>

            {detailsModal.winning && (
              <StyledView className="bg-gray-50 rounded-lg p-4">
                <StyledView className="flex-row justify-between py-2 border-b border-gray-200">
                  <ThemedText className="text-gray-600">Ticket No:</ThemedText>
                  <ThemedText className="font-semibold">
                    {detailsModal.winning.ticket_number}
                  </ThemedText>
                </StyledView>

                <StyledView className="flex-row justify-between py-2 border-b border-gray-200">
                  <ThemedText className="text-gray-600">Bettor:</ThemedText>
                  <ThemedText className="font-semibold">
                    {detailsModal.winning.users?.name}
                  </ThemedText>
                </StyledView>

                <StyledView className="flex-row justify-between py-2 border-b border-gray-200">
                  <ThemedText className="text-gray-600">Contact:</ThemedText>
                  <ThemedText className="font-semibold">
                    {detailsModal.winning.contact_number}
                  </ThemedText>
                </StyledView>

                <StyledView className="flex-row justify-between py-2 border-b border-gray-200">
                  <ThemedText className="text-gray-600">Amount:</ThemedText>
                  <ThemedText className="font-semibold">
                    ₱{detailsModal.winning.bet_amount}
                  </ThemedText>
                </StyledView>

                <StyledView className="flex-row justify-between py-2">
                  <ThemedText className="text-gray-600">Total Win:</ThemedText>
                  <ThemedText className="font-semibold text-[#6F13F5]">
                    ₱{detailsModal.winning.winning_amount}
                  </ThemedText>
                </StyledView>
              </StyledView>
            )}
          </StyledView>
        </StyledView>
      </StyledModal>
    </StyledSafeAreaView>
  );
}
