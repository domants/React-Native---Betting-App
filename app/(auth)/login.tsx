import { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // First, check if the identifier is an email
      const isEmail = identifier.includes("@");
      let email = identifier;

      // If not an email, look up the user's email by username
      if (!isEmail) {
        const { data: userData, error: userError } = await supabase
          .from("Users")
          .select("email")
          .eq("username", identifier)
          .single();

        if (userError || !userData) {
          Alert.alert("Error", "User not found");
          return;
        }

        email = userData.email;
      }

      // Attempt login with email
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        Alert.alert("Error", "Invalid credentials");
        return;
      }

      if (!user) {
        Alert.alert("Error", "Authentication failed");
        return;
      }

      // Check if user exists in Users table
      const { data: userData, error: userError } = await supabase
        .from("Users")
        .select("*")
        .eq("id", user.id);

      // If user doesn't exist in Users table, create a record
      if (!userData || userData.length === 0) {
        const { error: insertError } = await supabase.from("Users").insert([
          {
            id: user.id,
            email: user.email,
            username: user.email?.split("@")[0],
            display_name: user.email?.split("@")[0],
          },
        ]);

        if (insertError) {
          Alert.alert("Error", "Failed to set up user account");
          return;
        }

        // Fetch the newly created user data
        const { data: newUserData, error: fetchError } = await supabase
          .from("Users")
          .select("username, display_name")
          .eq("id", user.id)
          .single();

        if (fetchError || !newUserData) {
          Alert.alert("Error", "Failed to fetch user account");
          return;
        }

        router.replace({
          pathname: "/(tabs)/dashboard",
          params: {
            username:
              newUserData.display_name ||
              newUserData.username ||
              email.split("@")[0],
          },
        });
      } else {
        router.replace({
          pathname: "/(tabs)/dashboard",
          params: {
            username:
              userData[0].display_name ||
              userData[0].username ||
              email.split("@")[0],
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/(auth)/register" as const);
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/reset-password");
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6 justify-center">
        <ThemedText className="text-2xl font-bold text-center mb-8">
          Welcome to BetMaster
        </ThemedText>

        <View className="space-y-4">
          <View className="space-y-2">
            <ThemedText className="text-base font-medium">
              Email or Username
            </ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your email or username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
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
          <TouchableOpacity
            className="bg-black p-4 rounded-lg items-center mt-2"
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText className="text-white text-base font-semibold">
              {loading ? "Logging in..." : "Log In"}
            </ThemedText>
          </TouchableOpacity>

          {/*
          <TouchableOpacity onPress={handleForgotPassword}>
            <ThemedText className="text-blue-500 text-center text-sm">
              Forgot password?
            </ThemedText>
          </TouchableOpacity>
          
          <View className="flex-row justify-center mt-6">
            <ThemedText className="text-gray-500">
              Don't have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={handleSignUp}>
              <ThemedText className="text-blue-500 font-medium">
                Sign up
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          */}
        </View>
      </View>
    </SafeAreaView>
  );
}
