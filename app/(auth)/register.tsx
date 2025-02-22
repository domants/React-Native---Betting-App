import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

// Add these interfaces at the top of the file
interface RoleOption {
  label: string;
  value: string;
}

export default function RegisterScreen() {
  const { user, isLoading: authLoading } = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // All hooks must be at the top level, before any conditionals
  useEffect(() => {
    console.log("Register screen auth state changed:", {
      isLoading: authLoading,
      user: user ? { id: user.id, role: user.role } : null,
    });
  }, [authLoading, user]);

  useEffect(() => {
    const checkFirstUser = async () => {
      // Don't check while still loading auth state
      if (authLoading) {
        console.log("Still loading auth state, skipping check");
        return;
      }

      console.log("Checking first user, current user state:", {
        isAuthenticated: !!user,
        userRole: user?.role,
        isLoading: authLoading,
      });

      // Only redirect if we're not authenticated AND we're done loading
      if (!user && !authLoading) {
        try {
          const { count, error } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

          console.log("First user check result:", { count, error });

          if (count !== 0) {
            console.log(
              "Users exist and no authenticated user, redirecting to login"
            );
            router.replace("/(auth)/login");
          }
        } catch (error) {
          console.error("Error in checkFirstUser:", error);
        }
      }
    };

    checkFirstUser();
  }, [user, authLoading]); // Add authLoading to dependencies

  // Helper functions after all hooks
  const getAvailableRoles = (userRole: string): string[] => {
    console.log("Getting available roles for:", userRole);
    let roles: string[] = [];

    switch (userRole?.toLowerCase()) {
      case "admin":
        roles = ["Coordinator", "Sub-Coordinator", "Usher"];
        break;
      case "coordinator":
        roles = ["Sub-Coordinator", "Usher"];
        break;
      case "sub-coordinator":
        roles = ["Usher"];
        break;
      default:
        roles = [];
    }

    console.log("Available roles:", roles);
    return roles;
  };

  const dropdownRoles: RoleOption[] = user
    ? getAvailableRoles(user.role).map((role: string) => ({
        label: role,
        value: role,
      }))
    : [];

  const handleRegister = async () => {
    if (!email || !password || !name || !selectedRole) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsRegistering(true);

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: selectedRole,
            parent_id: user?.id, // Store reference to parent user
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
        role: selectedRole,
        parent_id: user?.id, // Store reference to parent user
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      Alert.alert("Success", "Account created successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/(admin)/users/manage"),
        },
      ]);
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Render loading state
  if (authLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-white justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </StyledSafeAreaView>
    );
  }

  // Main render
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

          {user && (
            <StyledView>
              <ThemedText className="text-sm font-medium mb-1">Role</ThemedText>
              <Dropdown<RoleOption>
                style={{
                  height: 50,
                  backgroundColor: "rgb(243, 244, 246)",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                }}
                data={dropdownRoles}
                labelField="label"
                valueField="value"
                placeholder="Select role"
                value={selectedRole}
                onChange={(item: RoleOption) => setSelectedRole(item.value)}
              />
            </StyledView>
          )}

          <TouchableOpacity
            className="bg-black py-3 rounded-lg mt-4"
            onPress={handleRegister}
            disabled={isRegistering}
          >
            <ThemedText className="text-white text-center font-semibold">
              {isRegistering ? "Creating Account..." : "Create Account"}
            </ThemedText>
          </TouchableOpacity>

          {!user && (
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <ThemedText className="text-center text-gray-600">
                Already have an account? Login
              </ThemedText>
            </TouchableOpacity>
          )}
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
}
