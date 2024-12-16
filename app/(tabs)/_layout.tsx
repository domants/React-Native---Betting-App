import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Theme } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme() as Theme;
  const [totalBetValue, setTotalBetValue] = useState(0);
  const navigation = useNavigation();

  // Handle parameter updates from new-bet screen
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
      screenListeners={{
        state: (event) => {
          const params =
            event.data.state?.routes?.[event.data.state.routes.length - 1]
              ?.params;
          if (params && "totalBetValue" in params) {
            setTotalBetValue(Number(params.totalBetValue) || 0);
          }
        },
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
