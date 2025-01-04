import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvailableRoles, createUser } from "@/lib/api/users";
import * as Crypto from "expo-crypto";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

export default function RegisterScreen() {
  const { user } = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Get available roles based on current user's role and format for dropdown
  const dropdownRoles = user
    ? getAvailableRoles(user.role).map((role) => ({
        label: role,
        value: role,
      }))
    : [];

  const handleRegister = async () => {
    if (!name || !email || !password || !selectedRole) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Hash the password
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      // Create user with the createUser function
      await createUser({
        name,
        email,
        password_hash: hashedPassword,
        role: selectedRole as any,
        parent_id: user?.id,
      });

      Alert.alert("Success", "User created successfully");
      router.back();
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <StyledScrollView className="flex-1 px-8">
        <ThemedText className="text-3xl font-bold mb-8 mt-8 text-center">
          Create Account
        </ThemedText>

        <StyledView className="space-y-4">
          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">Name</ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">Email</ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg"
              placeholder="Enter email"
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
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </StyledView>

          <StyledView>
            <ThemedText className="text-sm font-medium mb-1">Role</ThemedText>
            <Dropdown
              style={{
                height: 50,
                backgroundColor: "rgb(243, 244, 246)",
                borderRadius: 8,
                paddingHorizontal: 16,
              }}
              placeholderStyle={{
                color: "#9CA3AF",
                fontSize: 14,
              }}
              selectedTextStyle={{
                color: "#000000",
                fontSize: 14,
              }}
              data={dropdownRoles}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select role"
              value={selectedRole}
              onChange={(item) => {
                setSelectedRole(item.value);
              }}
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
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}
