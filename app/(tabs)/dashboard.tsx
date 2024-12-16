import { View, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { styled } from "nativewind";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Theme } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface FinancialCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

function FinancialCard({ title, value, icon }: FinancialCardProps) {
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  return (
    <ThemedView className="w-[48%] p-3 rounded-xl bg-white/10 border border-white/20">
      <StyledView className="flex-row items-center gap-2 mb-2">
        <MaterialIcons name={icon} size={24} color={iconColor} />
        <ThemedText className="text-sm opacity-70">{title}</ThemedText>
      </StyledView>
      <ThemedText className="text-lg font-bold">₱ {value}</ThemedText>
    </ThemedView>
  );
}

interface GameTabProps {
  title: string;
  isActive?: boolean;
  onPress: () => void;
}

function GameTab({ title, isActive, onPress }: GameTabProps) {
  return (
    <ThemedView
      className={`py-2 px-4 rounded-full border ${
        isActive ? "bg-[#6200ee] border-[#6200ee]" : "border-white/20"
      }`}
      onTouchEnd={onPress}
    >
      <ThemedText className={`text-base ${isActive ? "text-white" : ""}`}>
        {title}
      </ThemedText>
    </ThemedView>
  );
}

interface GameItemProps {
  title: string;
  time: string;
  onAddBet: () => void;
}

function GameItem({ title, time, onAddBet }: GameItemProps) {
  return (
    <StyledView className="flex-row justify-between items-center py-3 border-b border-white/20">
      <StyledView className="flex-1">
        <ThemedText className="text-base font-bold mb-1">{title}</ThemedText>
        <ThemedText className="text-sm opacity-70">{time}</ThemedText>
      </StyledView>
      <ThemedView
        className="py-2 px-4 rounded-full bg-[#6200ee]"
        onTouchEnd={onAddBet}
      >
        <ThemedText className="text-sm text-white font-bold">
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

  const handleTabPress = (tabName: string) => {
    const eventData = GAME_DATA[tabName as keyof typeof GAME_DATA];
    console.log("Checking availability for:", tabName);
    console.log("Cutoff time:", eventData.cutoffTime);

    if (!isEventAvailable(eventData.cutoffTime)) {
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
    setAlertConfig({
      isVisible: true,
      title: "Add Bet",
      message: `Adding bet for ${gameTitle}`,
      type: "info",
      onConfirm: () =>
        setAlertConfig((prev) => ({ ...prev, isVisible: false })),
      confirmText: "OK",
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

  return (
    <StyledSafeAreaView className="flex-1 p-4">
      <AlertDialog {...alertConfig} />
      <StyledView className="flex-row justify-between items-start mb-5">
        <StyledView>
          <ThemedText className="text-2xl font-bold mb-1">
            Welcome {username || "Guest"}!
          </ThemedText>
          <ThemedText className="text-sm opacity-70">{date}</ThemedText>
        </StyledView>
        <StyledView className="flex-row items-center">
          <StyledView className="w-2 h-2 rounded-full bg-[#4CAF50] mr-1.5" />
          <ThemedText className="text-sm text-[#4CAF50]">Online</ThemedText>
        </StyledView>
      </StyledView>

      <StyledView className="flex-row flex-wrap gap-3 mb-6">
        <FinancialCard title="Gross" value="0.00" icon="account-balance" />
        <FinancialCard title="Net Income" value="0.00" icon="payments" />
        <FinancialCard title="Winnings" value="0.00" icon="emoji-events" />
        <FinancialCard
          title="Bet Commission"
          value="0.00"
          icon="confirmation-number"
        />
        <FinancialCard title="Remit to Upline" value="0.00" icon="upload" />
        <StyledView className="w-[48%] flex-row items-center">
          <FinancialCard
            title={isSynced ? "Synced Data" : "Unsynced Data"}
            value="0"
            icon="sync"
          />
          <MaterialIcons
            name="refresh"
            size={24}
            color={Colors[colorScheme ?? "light"].icon}
            className="absolute right-3 top-1/2 -translate-y-3"
            onPress={handleSync}
          />
        </StyledView>
      </StyledView>

      <ThemedView className="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 mb-auto">
        <ThemedText className="text-lg font-bold mb-3.5">
          Today's Games
        </ThemedText>
        <StyledView className="flex-row justify-between mb-2.5">
          {Object.keys(GAME_DATA).map((tabName) => (
            <GameTab
              key={tabName}
              title={tabName}
              isActive={activeTab === tabName}
              onPress={() => handleTabPress(tabName)}
            />
          ))}
        </StyledView>
        <StyledView className="gap-3">
          {GAME_DATA[activeTab as keyof typeof GAME_DATA].games.map((game) => (
            <GameItem
              key={game.title}
              title={game.title}
              time={game.time}
              onAddBet={() => handleAddBet(game.title)}
            />
          ))}
        </StyledView>
      </ThemedView>

      <StyledView className="mt-auto pt-4 pb-6 border-t border-white/20">
        <StyledView className="px-2 pb-0.5">
          <ThemedText className="text-lg font-bold text-right mb-4">
            Total Bet: ₱0.00
          </ThemedText>
          <ThemedView
            className="p-4 rounded-xl bg-[#6200ee] items-center w-full"
            onTouchEnd={handleSubmitBet}
          >
            <ThemedText className="text-base font-bold text-white">
              Submit Bet
            </ThemedText>
          </ThemedView>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
