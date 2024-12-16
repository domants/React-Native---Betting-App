import { View, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { styled } from "nativewind";
import { router } from "expo-router";
import { useNavigation } from "@react-navigation/native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Theme } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { supabase } from "@/lib/supabase";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

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
}

function GameItem({ title, time, onAddBet, isLast }: GameItemProps) {
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
        className="py-2 px-4 rounded-full bg-[#6F13F5] hover:bg-[#6F13F5]/80 transition-colors"
        onTouchEnd={onAddBet}
      >
        <ThemedText className="text-sm font-bold text-[#DFCAFD]">
          Add Bet
        </ThemedText>
      </ThemedView>
    </StyledView>
  );
}

function getCurrentPhTime() {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Manila",
    hour: "numeric" as const,
    minute: "numeric" as const,
    hour12: true,
  };
  return new Date().toLocaleString("en-US", options);
}

function isEventAvailable(eventTime: string): boolean {
  // Get current time in Manila in 12-hour format (e.g., "2:30 PM")
  const currentTimeStr = getCurrentPhTime();

  // Parse current time - handle the case where PM/AM might be at the end
  const currentTimeParts = currentTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!currentTimeParts) return false;

  let currentHour = parseInt(currentTimeParts[1]);
  let currentMinute = parseInt(currentTimeParts[2]);
  const currentModifier = currentTimeParts[3].toUpperCase();

  // Parse cutoff time
  const cutoffTimeParts = eventTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!cutoffTimeParts) return false;

  let cutoffHour = parseInt(cutoffTimeParts[1]);
  let cutoffMinute = parseInt(cutoffTimeParts[2]);
  const cutoffModifier = cutoffTimeParts[3].toUpperCase();

  // Debug logs for initial values
  console.log(
    "Raw Current Time:",
    currentTimeStr,
    `(${currentHour}:${currentMinute} ${currentModifier})`
  );
  console.log(
    "Raw Cutoff Time:",
    eventTime,
    `(${cutoffHour}:${cutoffMinute} ${cutoffModifier})`
  );

  // Convert to 24-hour format
  if (currentModifier === "PM" && currentHour !== 12) {
    currentHour += 12;
  } else if (currentModifier === "AM" && currentHour === 12) {
    currentHour = 0;
  }

  if (cutoffModifier === "PM" && cutoffHour !== 12) {
    cutoffHour += 12;
  } else if (cutoffModifier === "AM" && cutoffHour === 12) {
    cutoffHour = 0;
  }

  const currentMins = currentHour * 60 + currentMinute;
  const cutoffMins = cutoffHour * 60 + cutoffMinute;

  console.log(
    `24h format - Current: ${currentHour}:${currentMinute} (${currentMins} mins)`
  );
  console.log(
    `24h format - Cutoff: ${cutoffHour}:${cutoffMinute} (${cutoffMins} mins)`
  );
  console.log(`Comparing minutes: ${currentMins} <= ${cutoffMins}`);

  return currentMins <= cutoffMins;
}

const GAME_DATA = {
  "11AM Events": {
    cutoffTime: "10:00 AM",
    games: [
      { title: "11AM SWERTRES", time: "10:45 AM" },
      { title: "11AM LAST TWO", time: "10:45 AM" },
    ],
  },
  "5PM Events": {
    cutoffTime: "4:00 PM",
    games: [
      { title: "5PM SWERTRES", time: "04:45 PM" },
      { title: "5PM LAST TWO", time: "04:45 PM" },
    ],
  },
  "9PM Events": {
    cutoffTime: "8:00 PM",
    games: [
      { title: "9PM SWERTRES", time: "08:45 PM" },
      { title: "9PM LAST TWO", time: "08:45 PM" },
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
    return !isEventAvailable(eventData.cutoffTime);
  };

  const handleTabPress = (tabName: string) => {
    if (isEventDisabled(tabName)) {
      setAlertConfig({
        isVisible: true,
        title: "Event Unavailable",
        message:
          "This event's betting period has ended. Please wait for the next schedule.",
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

  const handleAddBet = (gameTitle: string) => {
    const eventData = GAME_DATA[activeTab as keyof typeof GAME_DATA];
    if (!isEventAvailable(eventData.cutoffTime)) {
      setAlertConfig({
        isVisible: true,
        title: "Betting Closed",
        message:
          "This event's betting period has ended. Please wait for the next schedule.",
        type: "warning",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, isVisible: false })),
        confirmText: "OK",
      });
      return;
    }

    // Navigate to new bet screen
    router.push({
      pathname: "/(tabs)/new-bet",
      params: {
        gameTitle,
        eventTime: eventData.cutoffTime,
      },
    });
  };

  const handleSubmitBet = () => {
    setAlertConfig({
      isVisible: true,
      title: "Submit Bet",
      message: "Are you sure you want to submit your bets?",
      type: "info",
      onConfirm: () => {
        setAlertConfig({
          isVisible: true,
          title: "Success",
          message: "Bets submitted successfully!",
          type: "success",
          onConfirm: () =>
            setAlertConfig((prev) => ({ ...prev, isVisible: false })),
          confirmText: "OK",
        });
      },
      onCancel: () => setAlertConfig((prev) => ({ ...prev, isVisible: false })),
      confirmText: "Submit",
      cancelText: "Cancel",
    });
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

  // Add this useEffect to listen for route params changes
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (event: any) => {
      const params =
        event.data.state?.routes?.[event.data.state.routes.length - 1]?.params;
      if (params && "totalBetValue" in params) {
        setTotalBetValue(Number(params.totalBetValue) || 0);
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <StyledSafeAreaView className="flex-1 p-4 bg-[#FDFDFD]">
      <AlertDialog {...alertConfig} />
      <StyledView className="flex-row justify-between items-start mb-5">
        <StyledView>
          <ThemedText className="text-2xl font-bold mb-1 text-[#9654F7]">
            Welcome {username || "Guest"}!
          </ThemedText>
          <ThemedText className="text-sm text-[#867F91]">{date}</ThemedText>
        </StyledView>
        <StyledView className="flex-row items-center">
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
            onTouchEnd={handleSubmitBet}
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
