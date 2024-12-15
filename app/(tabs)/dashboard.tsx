import { StyleSheet, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Theme } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface FinancialCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

function FinancialCard({ title, value, icon }: FinancialCardProps) {
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].icon;

  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      </View>
      <ThemedText style={styles.cardValue}>₱ {value}</ThemedText>
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
      style={[styles.tab, isActive && styles.activeTab]}
      onTouchEnd={onPress}
    >
      <ThemedText style={[styles.tabText, isActive && styles.activeTabText]}>
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
    <View style={styles.gameItem}>
      <View style={styles.gameInfo}>
        <ThemedText style={styles.gameTitle}>{title}</ThemedText>
        <ThemedText style={styles.gameTime}>{time}</ThemedText>
      </View>
      <ThemedView style={styles.addBetButton} onTouchEnd={onAddBet}>
        <ThemedText style={styles.addBetText}>Add Bet</ThemedText>
      </ThemedView>
    </View>
  );
}

const GAME_DATA = {
  "2PM Events": [
    { title: "2PM SWERTRES", time: "01:45 PM" },
    { title: "2PM LAST TWO", time: "01:45 PM" },
  ],
  "5PM Events": [
    { title: "5PM SWERTRES", time: "04:45 PM" },
    { title: "5PM LAST TWO", time: "04:45 PM" },
  ],
  "9PM Events": [
    { title: "9PM SWERTRES", time: "08:45 PM" },
    { title: "9PM LAST TWO", time: "08:45 PM" },
  ],
};

export default function DashboardScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const colorScheme = useColorScheme() as Theme;
  const [activeTab, setActiveTab] = useState("2PM Events");
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.welcomeText}>
            Welcome {username || "testteller002"}!
          </ThemedText>
          <ThemedText style={styles.dateText}>{date}</ThemedText>
        </View>
        <View style={styles.onlineStatus}>
          <View style={styles.onlineDot} />
          <ThemedText style={styles.onlineText}>Online</ThemedText>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <FinancialCard title="Gross" value="0.00" icon="account-balance" />
        <FinancialCard title="Net Income" value="0.00" icon="payments" />
        <FinancialCard title="Winnings" value="0.00" icon="emoji-events" />
        <FinancialCard
          title="Bet Commission"
          value="0.00"
          icon="confirmation-number"
        />
        <FinancialCard title="Remit to Upline" value="0.00" icon="upload" />
        <View style={styles.syncCard}>
          <FinancialCard title="Unsynced Data" value="0" icon="sync" />
          <MaterialIcons
            name="refresh"
            size={24}
            color={Colors[colorScheme ?? "light"].icon}
            style={styles.refreshIcon}
          />
        </View>
      </View>

      <ThemedView style={styles.gamesSection}>
        <ThemedText style={styles.sectionTitle}>Today's Games</ThemedText>
        <View style={styles.tabsContainer}>
          {Object.keys(GAME_DATA).map((tabName) => (
            <GameTab
              key={tabName}
              title={tabName}
              isActive={activeTab === tabName}
              onPress={() => handleTabPress(tabName)}
            />
          ))}
        </View>
        <View style={styles.gamesList}>
          {GAME_DATA[activeTab as keyof typeof GAME_DATA].map((game) => (
            <GameItem
              key={game.title}
              title={game.title}
              time={game.time}
              onAddBet={() => handleAddBet(game.title)}
            />
          ))}
        </View>
      </ThemedView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <ThemedText style={styles.totalBet}>Total Bet: ₱ 0.00</ThemedText>
          <ThemedView style={styles.submitButton} onTouchEnd={handleSubmitBet}>
            <ThemedText style={styles.submitButtonText}>Submit Bet</ThemedText>
          </ThemedView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  onlineText: {
    fontSize: 14,
    color: "#4CAF50",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff10",
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  syncCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
  },
  refreshIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  gamesSection: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff10",
    borderWidth: 1,
    borderColor: "#ffffff20",
    marginBottom: "auto",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  activeTab: {
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: "#ffffff",
  },
  gamesList: {
    gap: 12,
  },
  gameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff20",
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  addBetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#6200ee",
  },
  addBetText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#ffffff20",
  },
  footerContent: {
    paddingHorizontal: 8,
    paddingBottom: 1,
  },
  totalBet: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#6200ee",
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
