//@ts-ignore
import React, { useEffect, useState } from "react";
//@ts-ignore
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
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
  const [activeFilter, setActiveFilter] = useState<BetFilter>("all");
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

  // Fetch bets for the selected date
  const { data: bets = [], isLoading: isBetsLoading } = useQuery({
    queryKey: ["bets", selectedDate.toISOString().split("T")[0], activeFilter],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      console.log("Querying for date:", dateStr);

      // First check if we can access the bets table at all
      const { data: testBets, error: testError } = await supabase
        .from("bets")
        .select("count");
      console.log("Test bets access:", { count: testBets, error: testError });

      // Get draw results
      const { data: drawResults, error: drawError } = await supabase
        .from("draw_results")
        .select("*")
        .eq("draw_date", dateStr);

      if (drawError) {
        console.error("Draw results error:", drawError);
        throw drawError;
      }

      // Check the current user's auth status
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", {
        id: user?.id,
        email: user?.email,
      });

      // Check the user's role directly
      const { data: roleCheck } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user?.id)
        .single();
      console.log("Role check:", roleCheck);

      // Inside your queryFn, after the role check
      console.log("Checking all bets in database...");

      // Try to get any bets without filters
      const { data: allBetsCheck, error: allBetsError } = await supabase
        .from("bets")
        .select("*");

      console.log("All bets in database:", {
        data: allBetsCheck,
        error: allBetsError,
        count: allBetsCheck?.length,
      });

      // Try with a specific date format
      const formattedDate = new Date(dateStr).toISOString().split("T")[0];
      console.log("Trying with formatted date:", formattedDate);

      const { data: dateCheckBets } = await supabase
        .from("bets")
        .select("bet_date, game_title")
        .eq("bet_date", formattedDate);

      console.log("Date check results:", {
        date: formattedDate,
        results: dateCheckBets,
      });

      // Check the RLS policy
      const { data: policyCheck } = await supabase
        .rpc("check_admin_access")
        .select("*");

      console.log("Policy check:", policyCheck);

      // Now try the actual query
      let query = supabase.from("bets").select("*").eq("bet_date", dateStr);

      const { data: bets, error: betsError } = await query;
      console.log("Query result:", {
        date: dateStr,
        filter: activeFilter,
        data: bets,
        error: betsError,
      });

      if (betsError) {
        console.error("Bets error:", betsError);
        throw betsError;
      }

      // If we have no bets, let's try a query without the date filter to see what dates we have
      if (!bets || bets.length === 0) {
        const { data: sampleBets } = await supabase
          .from("bets")
          .select("bet_date")
          .limit(5);
        console.log("Sample bet dates in database:", sampleBets);
      }

      // If we have bets, fetch the user names separately
      let userNames: Record<string, string> = {};
      if (bets && bets.length > 0) {
        const userIds = [...new Set(bets.map((bet) => bet.user_id))];
        const { data: users } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds);

        userNames = (users || []).reduce(
          (acc, user) => ({
            ...acc,
            [user.id]: user.name,
          }),
          {}
        );
      }

      // Process bets to determine win/loss status
      const processedBets = (bets || []).map((bet: any) => {
        console.log("Processing bet:", {
          gameTitle: bet.game_title,
          isLastTwo: bet.game_title === "LAST TWO",
          combination: bet.combination,
          drawTime: bet.draw_time,
        });

        const matchingResult = drawResults?.find(
          (result: {
            draw_time: string;
            l2_result: string;
            d3_result: string;
          }) => result.draw_time === bet.draw_time
        );

        console.log("Matching result:", {
          found: !!matchingResult,
          result: matchingResult,
          drawTime: bet.draw_time,
        });

        let status = "Pending";
        if (matchingResult) {
          const winningNumber =
            bet.game_title === "LAST TWO"
              ? matchingResult.l2_result
              : matchingResult.d3_result;

          // Add debug logging
          console.log("Win check:", {
            betNumber: bet.combination,
            winningNumber,
            matches: bet.combination === winningNumber,
            resultingStatus: bet.combination === winningNumber ? "Won" : "Lost",
          });

          status = bet.combination === winningNumber ? "Won" : "Lost";
        }

        const winningAmount =
          status === "Won"
            ? bet.amount * (bet.game_title === "LAST TWO" ? 80 : 400)
            : 0;

        return {
          ...bet,
          status,
          winningAmount,
          users: { name: userNames[bet.user_id] || "Unknown" },
        } as BetHistory;
      });

      console.log("Processed bets:", processedBets);
      return processedBets;
    },
    enabled: userRole === "Admin",
  });

  // Add this console log to verify the query is running
  console.log("Query state:", {
    isLoading: isBetsLoading,
    hasData: bets.length > 0,
    userRole,
  });

  if (isLoading || isBetsLoading) {
    return <LoadingSpinner />;
  }

  // If not admin, don't render anything (they should be redirected)
  if (userRole !== "Admin") {
    return null;
  }

  // Update the filtering logic to include game type
  const filteredBets = bets.filter((bet: BetHistory) => {
    // First check game type filter
    if (selectedGameType === "l2" && bet.game_title !== "LAST TWO") {
      return false;
    }
    if (selectedGameType === "3d" && bet.game_title !== "SWERTRES") {
      return false;
    }

    // Then check win/loss filters
    if (activeFilter === "wins") {
      return bet.status?.toLowerCase() === "won";
    }
    if (activeFilter === "losses") {
      return bet.status?.toLowerCase() === "lost";
    }

    return true;
  });

  // Log the filtered results
  console.log("Filtered results:", {
    filter: activeFilter,
    totalBets: bets.length,
    filteredCount: filteredBets.length,
    statuses: bets.map((b) => b.status),
  });

  const totalAmount = filteredBets.reduce((sum, bet) => sum + bet.amount, 0);

  // Add stats calculation
  const stats = {
    totalBets: filteredBets.length,
    wins: filteredBets.filter((bet) => bet.status === "Won").length,
    losses: filteredBets.filter((bet) => bet.status === "Lost").length,
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <StyledView className="flex-1 p-4">
        {/* Header */}
        <StyledView className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="text-2xl font-bold">
            Winning History
          </ThemedText>
        </StyledView>

        {/* Replace the Date Range Selector with this new Date Navigation */}
        <StyledView className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-4">
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              setSelectedDate(newDate);
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-1 mx-4"
          >
            <ThemedText className="text-center">
              {formatDate(selectedDate)}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              setSelectedDate(newDate);
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>
        </StyledView>

        {/* Stats Cards */}
        <StyledView className="flex-row mb-4 space-x-2">
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Total Bets</ThemedText>
            <ThemedText className="text-2xl font-bold">
              {stats.totalBets}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Wins</ThemedText>
            <ThemedText className="text-2xl font-bold text-green-500">
              {stats.wins}
            </ThemedText>
          </StyledView>
          <StyledView className="flex-1 p-4 bg-white rounded-lg shadow">
            <ThemedText className="text-gray-600">Losses</ThemedText>
            <ThemedText className="text-2xl font-bold text-red-500">
              {stats.losses}
            </ThemedText>
          </StyledView>
        </StyledView>

        {/* Filter Tabs */}
        <StyledView className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: "all", label: "All" },
            { id: "wins", label: "Wins" },
            { id: "losses", label: "Losses" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setActiveFilter(filter.id as BetFilter)}
              className={`flex-1 py-2 ${
                activeFilter === filter.id ? "bg-white rounded-md shadow" : ""
              }`}
            >
              <ThemedText
                className={`text-center ${
                  activeFilter === filter.id
                    ? "text-[#6F13F5] font-bold"
                    : "text-gray-600"
                }`}
              >
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </StyledView>

        {/* Game Type Dropdown */}
        <TouchableOpacity
          onPress={() => setShowGameDropdown(!showGameDropdown)}
          className="mb-4 p-4 border border-gray-200 rounded-lg flex-row justify-between items-center"
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

        {/* Dropdown Menu */}
        {showGameDropdown && (
          <StyledView className="bg-white rounded-lg mb-4 shadow absolute top-[215] left-4 right-4 z-10">
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
          </StyledView>
        )}

        {/* Bets List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {filteredBets.length > 0 ? (
            filteredBets.map((bet) => (
              <StyledView
                key={bet.id}
                className="bg-white p-4 rounded-lg shadow mb-3"
              >
                <StyledView className="flex-row justify-between items-center mb-2">
                  <ThemedText className="font-bold">
                    {bet.game_title} - {bet.combination}
                  </ThemedText>
                  <ThemedText
                    className={`${
                      bet.status === "Won"
                        ? "text-green-600"
                        : bet.status === "Lost"
                        ? "text-red-600"
                        : "text-yellow-600"
                    } font-bold`}
                  >
                    {bet.status}
                  </ThemedText>
                </StyledView>
                <StyledView className="flex-row justify-between items-center">
                  <ThemedText className="text-gray-600">
                    {formatDrawTime(bet.draw_time)}
                  </ThemedText>
                  <ThemedText className="text-[#6F13F5] font-bold">
                    ₱{bet.amount.toLocaleString()}
                  </ThemedText>
                </StyledView>
                <StyledView className="flex-row justify-between items-center mt-1">
                  <ThemedText className="text-gray-600">
                    Bettor: {bet.users?.name || "Unknown"}
                  </ThemedText>
                  {bet.status === "Won" && (
                    <ThemedText className="text-green-600 font-bold">
                      Won: ₱{bet.winningAmount?.toLocaleString()}
                    </ThemedText>
                  )}
                </StyledView>
                {bet.is_rumble && (
                  <ThemedText className="text-sm text-gray-500 mt-1">
                    Rumble
                  </ThemedText>
                )}
              </StyledView>
            ))
          ) : (
            <StyledView className="p-4">
              <ThemedText className="text-center text-gray-500">
                No bets found for this filter
              </ThemedText>
            </StyledView>
          )}
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setDateRange((prev) => ({
                  ...prev,
                  start: date,
                }));
              }
            }}
          />
        )}
      </StyledView>
    </StyledSafeAreaView>
  );
}
