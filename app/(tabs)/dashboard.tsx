import { View, Alert } from "react-native";
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
  isDisabled?: boolean;
  onPress: () => void;
}

function GameTab({ title, isActive, isDisabled, onPress }: GameTabProps) {
  return (
    <ThemedView
      className={`py-2 px-4 rounded-full border ${
        isActive ? "bg-[#6200ee] border-[#6200ee]" : "border-white/20"
      } ${isDisabled ? "opacity-50" : ""}`}
      onTouchEnd={!isDisabled ? onPress : undefined}
    >
      <ThemedText
        className={`text-base ${isActive ? "text-white" : ""} ${
          isDisabled ? "opacity-50" : ""
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
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
}

function isEventAvailable(eventTime: string): boolean {
  const currentDate = new Date(getCurrentPhTime());
  const [hour, modifier] = eventTime.split(" ");
  let [eventHour] = hour.split(":").map(Number);

  if (modifier === "PM" && eventHour < 12) eventHour += 12;
  if (modifier === "AM" && eventHour === 12) eventHour = 0;

  eventHour -= 1;

  const currentHour = currentDate.getHours();

  return currentHour < eventHour;
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

  const handleTabPress = (tabName: string) => {
    const eventData = GAME_DATA[tabName as keyof typeof GAME_DATA];
    if (!isEventAvailable(eventData.cutoffTime)) {
      Alert.alert(
        "Event Unavailable",
        "This event's betting period has ended. Please wait for the next schedule."
      );
      return;
    }
    setActiveTab(tabName);
  };

  const isTabDisabled = (tabName: string) => {
    const eventData = GAME_DATA[tabName as keyof typeof GAME_DATA];
    return !isEventAvailable(eventData.cutoffTime);
  };

  const handleAddBet = (gameTitle: string) => {
    Alert.alert("Add Bet", `Adding bet for ${gameTitle}`);
  };

  const handleSubmitBet = () => {
    Alert.alert(
      "Submit Bet",
      "Are you sure you want to submit your bets?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: () => Alert.alert("Success", "Bets submitted successfully!"),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <StyledSafeAreaView className="flex-1 p-4">
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
          <FinancialCard title="Unsynced Data" value="0" icon="sync" />
          <MaterialIcons
            name="refresh"
            size={24}
            color={Colors[colorScheme ?? "light"].icon}
            className="absolute right-3 top-1/2 -translate-y-3"
          />
        </StyledView>
      </StyledView>

      <ThemedView className="flex-1 p-4 rounded-xl bg-white/10 border border-white/20 mb-auto">
        <ThemedText className="text-lg font-bold mb-3.5">
          Today's Games
        </ThemedText>
        <StyledView className="flex-row gap-3 mb-2.5">
          {Object.keys(GAME_DATA).map((tabName) => (
            <GameTab
              key={tabName}
              title={tabName}
              isActive={activeTab === tabName}
              isDisabled={isTabDisabled(tabName)}
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
            Total Bet: ₱₱ 0.00
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
