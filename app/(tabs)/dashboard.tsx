//@ts-ignore
import { View, Alert, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { styled } from "nativewind";
import { router } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { fetchBetSummary, type BetSummary } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Theme } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  supabase,
  createBet,
  getBetById,
  getCurrentUserBets,
} from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

//cut off time before the event - in mnts
const CUTOFF_BEFORE_EVENT = 20;

interface FinancialCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  rightElement?: React.ReactNode;
}

function FinancialCard({
  title,
  value,
  icon,
  rightElement,
}: FinancialCardProps) {
  const colorScheme = useColorScheme();
  const iconColor = "#867F91";

  return (
    <ThemedView className="w-[48.5%] p-3 rounded-xl bg-[#F7F5FA] border border-[#5a189a] border-opacity-30">
      <StyledView className="flex-row items-center justify-between mb-2">
        <StyledView className="flex-row items-center flex-1 gap-2">
          <MaterialIcons name={icon} size={24} color={iconColor} />
          <ThemedText className="text-sm text-[#867F91] flex-1 flex-wrap">
            {title}
          </ThemedText>
        </StyledView>
        {rightElement}
      </StyledView>
      <ThemedText className="text-lg font-bold text-[#9654F7]">
        ₱ {value}
      </ThemedText>
    </ThemedView>
  );
}

interface GameTabProps {
  title: string;
  isActive?: boolean;
  onPress: () => void;
  isDisabled?: boolean;
}

function GameTab({ title, isActive, onPress, isDisabled }: GameTabProps) {
  return (
    <ThemedView
      className={`py-2 px-4 rounded-full border ${
        isDisabled
          ? "bg-[#C9C9C9] border-[#C9C9C9]"
          : isActive
          ? "bg-[#6F13F5] border-[#6F13F5]"
          : "border-[#5a189a] border-opacity-40"
      }`}
      onTouchEnd={isDisabled ? undefined : onPress}
    >
      <ThemedText
        className={`text-base ${
          isDisabled
            ? "text-[#867F91]"
            : isActive
            ? "text-[#DFCAFD]"
            : "text-[#867F91]"
        }`}
      >
        {title}
      </ThemedText>
    </ThemedView>
  );
}

interface GameItemProps {
  title: string;
  time: string;
  onAddBet: () => void;
  isLast?: boolean;
  isDisabled?: boolean;
}

function GameItem({
  title,
  time,
  onAddBet,
  isLast,
  isDisabled,
}: GameItemProps) {
  return (
    <StyledView
      className={`flex-row justify-between items-center py-2.5 ${
        !isLast ? "border-b border-[#5a189a] border-opacity-30" : ""
      }`}
    >
      <StyledView className="flex-1 mr-4">
        <ThemedText className="text-base font-bold mb-1 text-[#9654F7]">
          {title}
        </ThemedText>
        <ThemedText className="text-sm text-[#867F91]">{time}</ThemedText>
      </StyledView>
      <ThemedView
        className={`py-2 px-4 rounded-full ${
          isDisabled
            ? "bg-[#C9C9C9]"
            : "bg-[#6F13F5] hover:bg-[#6F13F5]/80 transition-colors"
        }`}
        onTouchEnd={isDisabled ? undefined : onAddBet}
      >
        <ThemedText
          className={`text-sm font-bold ${
            isDisabled ? "text-[#867F91]" : "text-[#DFCAFD]"
          }`}
        >
          Add Bet
        </ThemedText>
      </ThemedView>
    </StyledView>
  );
}

function getCurrentPhTime() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

function parseTime(timeStr: string): number {
  try {
    // Remove any extra spaces and ensure proper format
    const cleanTimeStr = timeStr.trim();
    const [time, period] = cleanTimeStr.split(/\s+/);
    const [hoursStr, minutesStr] = time.split(":");

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes)) {
      console.error("Invalid time format:", timeStr);
      return 0;
    }

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch (error) {
    console.error("Error parsing time:", timeStr, error);
    return 0;
  }
}

function isEventAvailable(eventTime: string): boolean {
  const currentTime = getCurrentPhTime();
  const currentMinutes = parseTime(currentTime);
  const eventMinutes = parseTime(eventTime);

  // for debugging
  /*
  console.log({
    currentTime,
    eventTime,
    currentMinutes,
    eventMinutes,
    cutoffMinutes: eventMinutes - CUTOFF_BEFORE_EVENT,
  });
*/
  // If current time is before event time
  if (eventMinutes > currentMinutes) {
    return currentMinutes <= eventMinutes - CUTOFF_BEFORE_EVENT;
  }

  return false;
}

const getEventTime = (tab: string) => {
  // Convert tab names to standardized format - handle both AM and PM
  const tabTime = tab.toLowerCase().replace(/[^0-9apm]/g, "");

  // Return the next draw time based on the selected tab
  switch (tabTime) {
    case "11am":
      return "11:00";
    case "5pm":
      return "17:00";
    case "9pm":
      return "21:00";
    default:
      // If no valid tab is selected, return null
      console.log("Invalid tab time:", tab); // For debugging
      return null;
  }
};

const GAME_DATA = {
  "11AM Events": {
    eventTime: "11:00",
    games: [
      { title: "SWERTRES", time: "11:00 AM" },
      { title: "LAST TWO", time: "11:00 AM" },
    ],
  },
  "5PM Events": {
    eventTime: "17:00",
    games: [
      { title: "SWERTRES", time: "5:00 PM" },
      { title: "LAST TWO", time: "5:00 PM" },
    ],
  },
  "9PM Events": {
    eventTime: "21:00",
    games: [
      { title: "SWERTRES", time: "9:00 PM" },
      { title: "LAST TWO", time: "9:00 PM" },
    ],
  },
};

interface AlertDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "success" | "warning" | "error" | "info";
}

function AlertDialog({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
}: AlertDialogProps) {
  const getColorByType = () => {
    switch (type) {
      case "success":
        return "bg-green-600";
      case "warning":
        return "bg-yellow-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-[#6200ee]";
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <StyledView className="flex-1 justify-center items-center bg-black/80">
        <ThemedView className="w-[90%] max-w-sm rounded-2xl bg-black border border-white/20">
          <StyledView className={`p-4 rounded-t-2xl ${getColorByType()}`}>
            <ThemedText className="text-lg font-bold text-white">
              {title}
            </ThemedText>
          </StyledView>

          <StyledView className="p-4">
            <ThemedText className="text-base mb-4 text-white">
              {message}
            </ThemedText>

            <StyledView className="flex-row justify-end gap-3">
              {onCancel && (
                <ThemedView
                  className="py-2 px-4 rounded-full bg-orange-300"
                  onTouchEnd={onCancel}
                >
                  <ThemedText className="text-sm font-bold text-black">
                    {cancelText}
                  </ThemedText>
                </ThemedView>
              )}
              {onConfirm && (
                <ThemedView
                  className={`py-2 px-4 rounded-full ${getColorByType()}`}
                  onTouchEnd={onConfirm}
                >
                  <ThemedText className="text-sm font-bold text-white">
                    {confirmText}
                  </ThemedText>
                </ThemedView>
              )}
            </StyledView>
          </StyledView>
        </ThemedView>
      </StyledView>
    </Modal>
  );
}

function LoadingSpinner() {
  return (
    <StyledView className="flex-1 justify-center items-center">
      <StyledView className="w-12 h-12 border-4 border-[#6F13F5] border-t-transparent rounded-full animate-spin" />
    </StyledView>
  );
}

// First, add the interface for bet details
interface BetDetail {
  combination: string;
  amount: number;
  is_rumble: boolean;
  game_title: string;
  draw_time: string;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { username } = useLocalSearchParams<{ username: string }>();
  const colorScheme = useColorScheme() as Theme;
  const [activeTab, setActiveTab] = useState("11AM Events");
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [alertConfig, setAlertConfig] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type?: "success" | "warning" | "error" | "info";
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isVisible: false,
    title: "",
    message: "",
  });

  const [isSynced, setIsSynced] = useState(false);

  const isEventDisabled = (tabName: string) => {
    const eventData = GAME_DATA[tabName as keyof typeof GAME_DATA];
    return !isEventAvailable(eventData.eventTime);
  };

  const handleTabPress = (tabName: string) => {
    if (isEventDisabled(tabName)) {
      setAlertConfig({
        isVisible: true,
        title: "Event Unavailable",
        message: `Betting for this event is closed. Betting closes ${CUTOFF_BEFORE_EVENT} minutes before the event time.`,
        type: "warning",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, isVisible: false })),
        confirmText: "OK",
      });
      return;
    }
    setActiveTab(tabName);
  };

  const [totalBetValue, setTotalBetValue] = useState<number>(0);

  // Add this state to track all bets
  const [allBets, setAllBets] = useState<
    Array<{
      combination: string;
      amount: number;
      is_rumble: boolean;
      game_title: string;
      draw_time: string;
    }>
  >([]);

  // Get params using useLocalSearchParams
  const { betDetails, totalBetValue: paramTotalBetValue } =
    useLocalSearchParams<{
      betDetails?: string;
      totalBetValue?: string;
    }>();

  // Update useEffect to handle JSON parsing safely
  useEffect(() => {
    if (betDetails) {
      try {
        const bets = JSON.parse(betDetails);
        setAllBets(bets);
        setTotalBetValue(
          bets.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0)
        );
      } catch (error) {
        console.error("Error parsing bet details:", error);
        // Initialize with empty state if parsing fails
        setAllBets([]);
        setTotalBetValue(0);
      }
    }
  }, [betDetails]);

  // Modify handleAddBet to pass existing bets
  const handleAddBet = (gameTitle: string) => {
    const eventTime = getEventTime(activeTab);
    if (!eventTime) {
      Alert.alert("Error", "Invalid draw time selected");
      return;
    }

    router.push({
      pathname: "/(tabs)/new-bet",
      params: {
        gameTitle,
        eventTime,
        existingBets: JSON.stringify(allBets),
      },
    });
  };

  // Update handleSubmitAllBets to handle JSON safely and close the alert
  const handleSubmitAllBets = async () => {
    try {
      if (!allBets || allBets.length === 0) {
        Alert.alert("Error", "No bets to submit");
        return;
      }

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Error", "You must be logged in to place bets");
        return;
      }

      // Add user_id and bet_date to each bet
      const betsToInsert = allBets.map((bet) => ({
        ...bet,
        user_id: session.user.id,
        bet_date: new Date().toISOString().split("T")[0],
      }));

      // Insert all bets
      const { error } = await supabase.from("bets").insert(betsToInsert);
      if (error) throw error;

      // Close the alert modal first
      setAlertConfig((prev) => ({ ...prev, isVisible: false }));

      // Reset states immediately
      setAllBets([]);
      setTotalBetValue(0);

      // Clear router params to reset form state
      router.setParams({
        totalBetValue: "0",
        betDetails: JSON.stringify([]),
        shouldResetForm: "true",
      });

      // Show success message
      Alert.alert("Success", "All bets have been submitted successfully", [
        {
          text: "OK",
          onPress: () => {
            setAllBets([]);
            setTotalBetValue(0);
            router.setParams({
              totalBetValue: "0",
              betDetails: JSON.stringify([]),
              shouldResetForm: "true",
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting bets:", error);
      setAlertConfig((prev) => ({ ...prev, isVisible: false }));
      Alert.alert("Error", "Failed to submit bets. Please try again.");
    }
  };

  const handleSync = () => {
    setAlertConfig({
      isVisible: true,
      title: "Success",
      message: "Data Synced!",
      type: "success",
      onConfirm: () => {
        setIsSynced(true);
        setAlertConfig((prev) => ({ ...prev, isVisible: false }));
      },
      confirmText: "OK",
    });
  };

  const isConnected = useNetworkStatus();
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  // Check Supabase connection
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkSupabaseConnection = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        setIsSupabaseConnected(true);
      } catch (error) {
        setIsSupabaseConnected(false);
      }
    };

    // Check immediately
    checkSupabaseConnection();

    // Then check every 30 seconds
    interval = setInterval(checkSupabaseConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  // Combined connection status
  const isOnline = isConnected && isSupabaseConnected;

  // Update the navigation effect
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (event: any) => {
      const params =
        event.data.state?.routes?.[event.data.state.routes.length - 1]?.params;
      if (params) {
        if ("totalBetValue" in params) {
          setTotalBetValue(Number(params.totalBetValue) || 0);
        }
        if ("betDetails" in params) {
          setAllBets(JSON.parse(params.betDetails as string));
          setTotalBetValue(
            JSON.parse(params.betDetails as string).reduce(
              (sum: number, bet: any) => sum + Number(bet.amount),
              0
            )
          );
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Combine auth checks into one effect
  useEffect(() => {
    async function initializeAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.replace("/(auth)/login");
          return;
        }

        setUserId(user.id);
      } catch (e) {
        console.error("Auth error:", e);
        router.replace("/(auth)/login");
      } finally {
        setIsAuthChecking(false);
      }
    }

    initializeAuth();
  }, []);

  // Bet summary query
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["betSummary", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      return await fetchBetSummary(userId);
    },
    enabled: !!userId,
  });

  // Add user data fetching
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: userData, error } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return userData;
    },
  });

  // Show loading state while either auth is checking or summary is loading
  if (isAuthChecking || isSummaryLoading) {
    return <LoadingSpinner />;
  }

  const handleSubmitBetClick = () => {
    if (allBets.length === 0) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Please add some bets before submitting.",
        type: "error",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, isVisible: false })),
        confirmText: "OK",
      });
      return;
    }

    const bets = JSON.stringify(allBets);
    setAlertConfig({
      isVisible: true,
      title: "Confirm Submission",
      message: `Are you sure you want to submit ${
        allBets.length
      } bet(s) with total amount of ₱${totalBetValue.toFixed(2)}?`,
      type: "info",
      onConfirm: handleSubmitAllBets,
      onCancel: () => setAlertConfig((prev) => ({ ...prev, isVisible: false })),
      confirmText: "Submit",
      cancelText: "Cancel",
    });
  };

  return (
    <StyledSafeAreaView className="flex-1 p-4 bg-[#FDFDFD]">
      <AlertDialog {...alertConfig} />
      <StyledView className="flex-row justify-between items-start mb-5">
        <StyledView>
          <ThemedText className="text-2xl font-bold mb-1 text-[#9654F7]">
            Welcome, {isUserLoading ? "..." : userData?.name || "Guest"}!
          </ThemedText>
          <ThemedText className="text-gray-500">
            {isUserLoading ? "..." : userData?.role || "Loading role..."}
          </ThemedText>
        </StyledView>
        <StyledView>
          <StyledView className="flex-row items-center mb-2">
            <StyledView
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              } mr-1.5`}
            />
            <ThemedText
              className={`text-sm ${
                isOnline ? "text-green-500" : "text-red-500"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </ThemedText>
          </StyledView>
        </StyledView>
      </StyledView>

      <StyledView className="flex-row flex-wrap justify-between mb-6">
        <StyledView className="w-full flex-row justify-between mb-2">
          <FinancialCard title="Gross" value="0.00" icon="account-balance" />
          <FinancialCard title="Net Income" value="0.00" icon="payments" />
        </StyledView>

        <StyledView className="w-full flex-row justify-between mb-2">
          <FinancialCard title="Winnings" value="0.00" icon="emoji-events" />
          <FinancialCard
            title="Bet Commission"
            value="0.00"
            icon="confirmation-number"
          />
        </StyledView>

        <StyledView className="w-full flex-row justify-between">
          <FinancialCard title="Remit to Upline" value="0.00" icon="upload" />
          <FinancialCard
            title={isSynced ? "Synced Data" : "Unsynced Data"}
            value="0"
            icon="sync"
            rightElement={
              <MaterialIcons
                name="refresh"
                size={24}
                color={Colors[colorScheme ?? "light"].icon}
                onPress={handleSync}
              />
            }
          />
        </StyledView>
      </StyledView>

      <ThemedView className="flex-1 p-4 rounded-xl bg-[#F7F5FA] border border-[#5a189a] border-opacity-30 mb-auto">
        <ThemedText className="text-lg font-bold mb-3.5 text-[#9654F7]">
          Today's Games
        </ThemedText>
        <StyledView className="flex-row justify-between mb-2.5">
          {Object.keys(GAME_DATA).map((tabName) => (
            <GameTab
              key={tabName}
              title={tabName}
              isActive={activeTab === tabName}
              isDisabled={isEventDisabled(tabName)}
              onPress={() => handleTabPress(tabName)}
            />
          ))}
        </StyledView>
        <StyledView className="flex-1 min-h-0">
          <StyledView className="flex-1 gap-3">
            {GAME_DATA[activeTab as keyof typeof GAME_DATA].games.map(
              (game, index, array) => (
                <GameItem
                  key={game.title}
                  title={game.title}
                  time={game.time}
                  onAddBet={() => handleAddBet(game.title)}
                  isLast={index === array.length - 1}
                  isDisabled={isEventDisabled(activeTab)}
                />
              )
            )}
          </StyledView>
        </StyledView>
      </ThemedView>

      <StyledView className="mt-4">
        <StyledView className="px-2 pb-0.5">
          <ThemedText className="text-lg font-bold text-right mb-4 text-[#9654F7]">
            Total Bet: ₱{totalBetValue.toFixed(2)}
          </ThemedText>
          <ThemedView
            className="p-4 rounded-xl bg-[#6F13F5] hover:bg-[#6F13F5]/80 transition-colors items-center w-full"
            onTouchEnd={handleSubmitBetClick}
          >
            <ThemedText className="text-base font-bold text-[#DFCAFD]">
              Submit Bet
            </ThemedText>
          </ThemedView>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
