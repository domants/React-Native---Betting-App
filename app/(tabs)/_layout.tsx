import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Theme } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme() as Theme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6F13F5",
        tabBarInactiveTintColor: "#C9C9C9",
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: Colors[colorScheme].background,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bets"
        options={{
          title: "Bets",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ticket.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="winners"
        options={{
          title: "Winners",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="trophy.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-bet"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
