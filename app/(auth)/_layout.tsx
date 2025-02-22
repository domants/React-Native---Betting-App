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
        name="login"
        options={{
          title: "Login",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
          headerShown: false,
        }}
      />
      {/* other screens */}
    </Stack>
  );
}
