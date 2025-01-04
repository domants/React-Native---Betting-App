import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { signIn } from "@/lib/api/auth";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function LoginScreen() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await signIn({ emailOrUsername, password });
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Invalid credentials"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 justify-center px-8">
        <ThemedText className="text-3xl font-bold mb-8 text-center">
          Welcome Back
        </ThemedText>

        <StyledView className="space-y-4">
          <StyledView>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Email or Username"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
            />
          </StyledView>

          <StyledView>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </StyledView>

          <TouchableOpacity
            className="bg-black py-3 rounded-lg"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText className="text-white text-center font-semibold">
              {isLoading ? "Logging in..." : "Login"}
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
