import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{
          title: "Admin Dashboard",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: "User Management",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="percentage"
        options={{
          title: "Percentage Management",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          title: "Draw Results",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="daily-bets"
        options={{
          title: "Daily Bets",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: "Bet History",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="limits"
        options={{
          title: "Bet Limits",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="audit"
        options={{
          title: "Audit Logs",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
