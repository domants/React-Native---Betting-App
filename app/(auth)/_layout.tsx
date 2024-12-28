import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitle: "",
        presentation: "modal",
      }}
    >
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
          headerTitle: "",
          animation: "slide_from_right",
        }}
      />
      {/* other screens */}
    </Stack>
  );
}
