import { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!email || !username || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            phone,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        "Success",
        "Registration successful! Please check your email for verification.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6 justify-center">
        <ThemedText className="text-2xl font-bold text-center mb-2">
          Create Account
        </ThemedText>
        <ThemedText className="text-base text-gray-500 text-center mb-8">
          Join BetMaster and start betting today
        </ThemedText>

        <View className="space-y-4">
          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Username</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Email</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Phone</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your phone number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Password</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">
              Confirm Password
            </ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Confirm your password"
              placeholderTextColor="#666"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            className="bg-black p-4 rounded-lg items-center mt-2"
            onPress={handleRegister}
          >
            <ThemedText className="text-white text-base font-semibold">
              Sign Up
            </ThemedText>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <ThemedText className="text-gray-500">
              Already have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={handleLogin}>
              <ThemedText className="text-blue-500 font-medium">
                Log in
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
