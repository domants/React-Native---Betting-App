import { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

import { ThemedText } from "@/components/text/ThemedText";

const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Get username from email (everything before @)
    const username = email.split("@")[0];

    // Navigate to dashboard with params
    router.replace({
      pathname: "/(tabs)/dashboard",
      params: { username },
    });
  };

  const handleSignUp = () => {
    router.push("/(auth)/register");
  };

  return (
    <StyledSafeAreaView className="flex-1">
      <StyledView className="flex-1 px-6 justify-center">
        <ThemedText className="text-2xl font-bold text-center mb-8">
          Welcome to BetMaster
        </ThemedText>

        <StyledView className="space-y-4">
          <StyledView className="space-y-2">
            <ThemedText className="text-base font-medium">Email</ThemedText>
            <StyledTextInput
              className="bg-white p-4 rounded-lg text-base text-black"
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </StyledView>

          <StyledView className="space-y-2">
            <ThemedText className="text-base font-medium">Password</ThemedText>
            <StyledTextInput
              className="bg-white p-4 rounded-lg text-base text-black"
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </StyledView>

          <StyledTouchableOpacity
            className="bg-black p-4 rounded-lg items-center mt-2"
            onPress={handleLogin}
          >
            <ThemedText className="text-white text-base font-semibold">
              Log In
            </ThemedText>
          </StyledTouchableOpacity>

          <StyledTouchableOpacity>
            <ThemedText className="text-blue-500 text-center text-sm">
              Forgot password?
            </ThemedText>
          </StyledTouchableOpacity>

          <StyledView className="flex-row justify-center mt-6">
            <ThemedText className="text-gray-500">
              Don't have an account?{" "}
            </ThemedText>
            <StyledTouchableOpacity onPress={handleSignUp}>
              <ThemedText className="text-blue-500 font-medium">
                Sign up
              </ThemedText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
