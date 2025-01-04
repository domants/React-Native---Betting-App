import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { signIn } from "@/lib/api/auth";
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

      // First try to sign in
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: emailOrUsername.toLowerCase(),
          password,
        });

      if (signInError) {
        console.error("Sign in error:", signInError);
        Alert.alert("Error", "Invalid email or password");
        return;
      }

      if (!signInData.user) {
        Alert.alert("Error", "Failed to authenticate user");
        return;
      }

      // Now check if user exists in users table
      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role, email")
        .eq("email", emailOrUsername.toLowerCase())
        .single();

      if (userError && userError.code !== "PGRST116") {
        console.error("Error checking existing user:", userError);
        Alert.alert("Error", "Failed to verify user account");
        return;
      }

      // Create user record if it doesn't exist
      if (!userData) {
        const newUserData = {
          id: signInData.user.id,
          email: emailOrUsername.toLowerCase(),
          role: "Admin", // Since this is your admin account
          username: emailOrUsername.toLowerCase().split("@")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from("users")
          .upsert([newUserData], {
            onConflict: "email",
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error("Error creating user record:", insertError);
          Alert.alert("Error", "Failed to create user account");
          return;
        }

        // Fetch the newly created user
        const { data: newUser, error: fetchError } = await supabase
          .from("users")
          .select("id, role, email")
          .eq("email", emailOrUsername.toLowerCase())
          .single();

        if (fetchError || !newUser) {
          console.error("Error fetching new user:", fetchError);
          Alert.alert("Error", "Failed to verify new user account");
          return;
        }

        userData = newUser;
      }

      // At this point userData must exist
      if (!userData) {
        Alert.alert("Error", "Failed to verify user account");
        return;
      }

      // Check if IDs match
      if (signInData.user.id !== userData.id) {
        // The IDs don't match, we need to update the auth user's ID
        console.log("Updating auth user ID to match users table...");
        console.log("Old ID:", signInData.user.id);
        console.log("New ID:", userData.id);

        const { error: updateError } = await supabase.rpc(
          "update_auth_user_id",
          {
            old_id: signInData.user.id,
            new_id: userData.id,
          }
        );

        if (updateError) {
          console.error("Error updating user ID:", updateError);
          Alert.alert("Error", "Failed to update user account");
          return;
        }
      }

      // Redirect based on role
      if (userData.role === "Admin") {
        router.replace("/(admin)/dashboard" as any);
      } else {
        router.replace("/(user)/dashboard" as any);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred");
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
