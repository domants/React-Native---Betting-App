import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "Admin", // First user is admin
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Failed to create user");
      }

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        role: "Admin",
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      Alert.alert(
        "Success",
        "Account created successfully. Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 px-4 py-8">
        <ThemedText className="text-3xl font-bold mb-8">
          Create Account
        </ThemedText>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">Name</ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">Email</ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">
              Password
            </ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </StyledView>

          <TouchableOpacity
            className="bg-black py-3 rounded-lg mt-4"
            onPress={handleRegister}
            disabled={isLoading}
          >
            <ThemedText className="text-white text-center font-semibold">
              {isLoading ? "Creating Account..." : "Create Account"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <ThemedText className="text-center text-gray-600">
              Already have an account? Login
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
