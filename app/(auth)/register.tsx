import { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // First sign up the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // If auth signup successful, create user record in Users table
      if (authData.user) {
        const { error: userError } = await supabase.from("Users").insert([
          {
            id: authData.user.id,
            email: email,
            username: username,
            display_name: username,
          },
        ]);

        if (userError) throw userError;
      }

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
      <View className="flex-1 p-6 pt-12">
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
            <ThemedText className="text-base font-medium">Password</ThemedText>
            <View className="relative">
              <TextInput
                className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
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
