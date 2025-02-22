import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function LoginScreen() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Attempting login with:", emailOrUsername);

      // First check if user exists in public.users
      const { data: publicUser, error: publicError } = await supabase
        .from("users")
        .select("*")
        .eq("email", emailOrUsername.toLowerCase())
        .single();

      console.log("Public user check:", { publicUser, publicError });

      // Try auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername.toLowerCase(),
        password,
      });

      console.log("Auth response:", { data, error });

      if (error) throw error;

      // Get user details including role
      const { data: userDetails, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      console.log("User details:", { userDetails, userError });

      if (userError) throw userError;

      // Route based on role
      switch (userDetails.role.toLowerCase()) {
        case "admin":
          router.replace("/(admin)/dashboard");
          break;
        case "coordinator":
        case "sub-coordinator":
        case "usher":
          router.replace("/(admin)/users/manage");
          break;
        default:
          router.replace("/(admin)/dashboard");
      }
    } catch (error: any) {
      console.error("Detailed login error:", error);
      Alert.alert("Error", "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailOrUsername) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailOrUsername,
        {
          //redirectTo: "yourapp://reset-password",
        }
      );

      if (error) throw error;
      Alert.alert(
        "Password Reset",
        "If an account exists with this email, you will receive password reset instructions."
      );
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert(
        "Error",
        "Failed to send password reset email. THis is on going functionality"
      );
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

          <TouchableOpacity className="mt-2" onPress={handleForgotPassword}>
            <ThemedText className="text-center text-gray-600">
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <ThemedText className="text-center text-gray-600 mt-4">
              Don't have an account? Register
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
