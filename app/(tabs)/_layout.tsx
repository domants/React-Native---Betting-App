import { Tabs, router } from "expo-router";
//@ts-ignore
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Theme } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCurrentUser } from "@/hooks/useCurrentUser";

//icons
import MaterialIcons from "@expo/vector-icons/MaterialIcons"; //dashboard
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"; //bets
import Foundation from "@expo/vector-icons/Foundation"; //results
import Ionicons from "@expo/vector-icons/Ionicons"; //trophy
//end of icons
export default function TabLayout() {
  const colorScheme = useColorScheme() as Theme;
  const [totalBetValue, setTotalBetValue] = useState(0);
  const navigation = useNavigation();
  const { user } = useCurrentUser();

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

  // If user is admin, redirect to admin dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/(admin)/dashboard");
    }
  }, [user]);

  // If user is admin, don't show regular tabs
  if (user?.role === "admin") {
    return null;
  }

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
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bets"
        options={{
          title: "Bets",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="money-check" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ({ color }) => (
            <Foundation name="results" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="winners"
        options={{
          title: "Winners",
          tabBarIcon: ({ color }) => (
            <Ionicons name="trophy-sharp" size={24} color={color} />
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
