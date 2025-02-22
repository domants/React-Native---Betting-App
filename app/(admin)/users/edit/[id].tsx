import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function EditUserScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { label: "Admin", value: "Admin" },
    { label: "Coordinator", value: "Coordinator" },
    { label: "Sub-Coordinator", value: "Sub-Coordinator" },
    { label: "Usher", value: "Usher" },
  ];

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setUser(user);
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "");
    } catch (error) {
      console.error("Error fetching user:", error);
      Alert.alert("Error", "Failed to load user details");
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const updates = {
        name,
        email,
        role,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "User updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <ThemedText className="text-xl font-semibold">Edit User</ThemedText>
      </StyledView>

      <StyledView className="p-4 space-y-4">
        <StyledView>
          <ThemedText className="text-sm font-medium mb-1">Name</ThemedText>
          <TextInput
            className="bg-gray-100 px-4 py-3 rounded-lg"
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
          />
        </StyledView>

        <StyledView>
          <ThemedText className="text-sm font-medium mb-1">Email</ThemedText>
          <TextInput
            className="bg-gray-100 px-4 py-3 rounded-lg"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
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
            data={roles}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select role"
            value={role}
            onChange={(item) => setRole(item.value)}
          />
        </StyledView>

        <TouchableOpacity
          className="bg-black py-3 rounded-lg mt-4"
          onPress={handleSave}
          disabled={isLoading}
        >
          <ThemedText className="text-white text-center font-semibold">
            {isLoading ? "Saving..." : "Save Changes"}
          </ThemedText>
        </TouchableOpacity>
      </StyledView>
    </StyledSafeAreaView>
  );
}
