import { useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password updated successfully", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6 justify-center">
        <ThemedText className="text-2xl font-bold text-center mb-8">
          Set New Password
        </ThemedText>

        <View className="space-y-4">
          <View className="space-y-2">
            <ThemedText className="text-base font-medium">
              New Password
            </ThemedText>
            <View className="relative">
              <TextInput
                className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
                placeholder="Enter new password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
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

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">
              Confirm Password
            </ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            className="bg-black p-4 rounded-lg items-center mt-2"
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <ThemedText className="text-white text-base font-semibold">
              {loading ? "Updating..." : "Update Password"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
