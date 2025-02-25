//@ts-ignore
import React, { useEffect, useState } from "react";
//@ts-ignore
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getBetHistory } from "@/lib/api/admin";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

type BetFilter = "all" | "last_two" | "swertres" | "wins" | "losses";

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

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "l2" | "3d">("all");
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
  const [selectedGameType, setSelectedGameType] = useState<"all" | "l2" | "3d">(
    "all"
  );

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
    if (activeFilter === "l2") return winning.game_title === "LAST TWO";
    if (activeFilter === "3d") return winning.game_title === "SWERTRES";
    return true;
  });

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
        {/* Header */}
        <StyledView className="flex-row justify-center mb-6">
          <ThemedText className="text-2xl font-bold">
            Winning History
          </ThemedText>
        </StyledView>

        {/* Date Navigation */}
        <StyledView className="flex-row items-center justify-between mb-4">
          <TouchableOpacity>
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-6 py-2 rounded-lg border border-gray-200"
          >
            <ThemedText>February 25, 2025</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity>
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </StyledView>

        {/* Search Bar */}
        <StyledView className="flex-row items-center mb-4">
          <StyledView className="flex-1 mr-2">
            <TextInput
              placeholder="Search winners..."
              className="bg-white px-4 py-2 rounded-lg border border-gray-200"
            />
          </StyledView>
          <TouchableOpacity>
            <MaterialIcons name="file-download" size={24} color="#000" />
          </TouchableOpacity>
        </StyledView>

        {/* Game Type Filter (keep existing dropdown) */}
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

        {/* Keep existing dropdown menu */}
        {showGameDropdown && (
          <StyledView className="bg-white rounded-lg mb-4 shadow absolute top-[200] left-4 right-4 z-10">
            {[
              { id: "all", label: "All Games" },
              { id: "l2", label: "Last Two" },
              { id: "3d", label: "Swertres" },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setSelectedGameType(option.id as "all" | "l2" | "3d");
                  setShowGameDropdown(false);
                }}
                className={`p-4 border-b border-gray-100`}
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
          </StyledView>
        )}

        {/* Winnings List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {filteredWinnings.map((winning) => (
            <StyledView
              key={winning.id}
              className="bg-white p-4 rounded-lg border border-gray-100 mb-3"
            >
              {/* Ticket Number Row */}
              <StyledView className="flex-row items-center mb-2">
                <MaterialIcons name="receipt" size={20} color="#666" />
                <ThemedText className="ml-2 font-semibold">
                  {winning.ticket_number}
                </ThemedText>
                <ThemedText className="ml-auto">
                  {formatDrawTime(winning.draw_time)}
                </ThemedText>
              </StyledView>

              {/* Name */}
              <ThemedText className="text-gray-600">
                {winning.users?.name}
              </ThemedText>

              {/* Contact Number */}
              <ThemedText className="text-gray-600">
                {winning.contact_number}
              </ThemedText>

              {/* Amount Row */}
              <ThemedText className="text-gray-600 mt-1">
                Amount: ₱{winning.bet_amount}
              </ThemedText>

              {/* Total Win Row */}
              <ThemedText className="font-bold text-[#6F13F5] mt-1">
                Total Win: ₱{winning.winning_amount}
              </ThemedText>
            </StyledView>
          ))}
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
      </StyledView>
    </StyledSafeAreaView>
  );
}
