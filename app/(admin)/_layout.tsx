import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AdminLayout() {
  const { user } = useCurrentUser();

  // Protect admin routes
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="percentage" />
        <Stack.Screen name="results" />
        <Stack.Screen name="daily-bets" />
        <Stack.Screen name="history" />
        <Stack.Screen name="limits" />
      </Stack>
    </GestureHandlerRootView>
  );
}
