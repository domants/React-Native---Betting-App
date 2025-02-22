import React, { useState, useEffect } from "react";
import { View, Alert, TouchableOpacity, TextInput } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { ScrollView } from "react-native-gesture-handler";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/ThemedText";
import type { User } from "@/lib/supabase";
import Modal from "react-native-modal";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<"name" | "email" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id, email, name, role, deleted_at, created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      setUsers(data || []);
    } catch (error) {
      console.error("Detailed error:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              // Delete from auth
              const { error: authError } = await supabase.auth.admin.deleteUser(
                userId
              );

              if (authError) throw authError;

              // Delete from database
              const { error: dbError } = await supabase
                .from("users")
                .delete()
                .eq("id", userId);

              if (dbError) throw dbError;

              await fetchUsers();
              Alert.alert("Success", "User permanently deleted");
            } catch (error) {
              console.error("Delete error details:", error);
              Alert.alert("Error", "Failed to delete user");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditUser = (user: User) => {
    Alert.alert("Edit User", "What would you like to edit?", [
      {
        text: "Edit Name",
        onPress: () => {
          setEditType("name");
          setEditValue(user.name || "");
          setSelectedUser(user);
          setEditModal(true);
        },
      },
      {
        text: "Edit Email",
        onPress: () => {
          setEditType("email");
          setEditValue(user.email);
          setSelectedUser(user);
          setEditModal(true);
        },
      },
      {
        text: "Delete User",
        style: "destructive",
        onPress: () => handleDeleteUser(user.id, user.email),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !editType || !editValue) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ [editType]: editValue })
        .eq("id", selectedUser.id);

      if (error) throw error;
      await fetchUsers();
      Alert.alert("Success", `${editType} updated successfully`);
      setEditModal(false);
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Failed to update user");
    }
  };

  const handleCreateUser = () => {
    console.log("Navigating to register screen from manage users");
    router.push("/(auth)/register");
  };

  React.useEffect(() => {
    console.log("ManageUsersScreen mounted, fetching users");
  }, []);

  if (isLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD] justify-center items-center">
        <ActivityIndicator size="large" color="#6F13F5" />
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      {/* Header */}
      <StyledView className="px-4 py-3 border-b border-gray-200 bg-white">
        <ThemedText className="text-2xl font-bold mb-4">
          User Management
        </ThemedText>

        {/* Search and Create User Row */}
        <StyledView className="flex-row items-center space-x-3">
          <StyledView className="flex-1 bg-gray-100 rounded-xl overflow-hidden">
            <TextInput
              className="px-4 py-2.5 text-base"
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </StyledView>
          <TouchableOpacity
            onPress={handleCreateUser}
            className="bg-[#6F13F5] px-4 py-2.5 rounded-xl flex-row items-center"
          >
            <MaterialIcons name="add" size={20} color="white" />
            <ThemedText className="text-white ml-2 font-medium">
              Create
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledView>

      {/* Table Header */}
      <StyledView className="flex-row px-4 py-3 bg-gray-50">
        <ThemedText className="flex-[2] font-semibold text-gray-600">
          Name
        </ThemedText>
        <ThemedText className="flex-[2] font-semibold text-gray-600">
          Email
        </ThemedText>
        {/* <ThemedText className="flex-1 font-semibold text-gray-600">
          Role
        </ThemedText> */}
        <ThemedText className="flex-1 font-semibold text-gray-600">
          Status
        </ThemedText>
        <ThemedText className="w-20 text-center font-semibold text-gray-600">
          Actions
        </ThemedText>
      </StyledView>

      {/* User List */}
      <ScrollView className="flex-1 bg-white">
        {filteredUsers.map((user) => (
          <StyledView
            key={user.id}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <ThemedText className="flex-[2] text-gray-800">
              {user.name || "-"}
            </ThemedText>
            <ThemedText className="flex-[2] text-gray-800">
              {user.email || "-"}
            </ThemedText>
            {/* <ThemedText className="flex-1 capitalize text-gray-800">
              {user.role}
            </ThemedText> */}
            <StyledView className="flex-1">
              <ThemedText
                className={`px-2 py-0.5 rounded-full text-center text-[11px] w-14 ${
                  user.deleted_at
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user.deleted_at ? "Inactive" : "Active"}
              </ThemedText>
            </StyledView>
            <StyledView className="w-20 flex-row justify-center space-x-4">
              <TouchableOpacity
                onPress={() => handleEditUser(user)}
                className="p-2"
              >
                <MaterialIcons name="edit" size={20} color="#6F13F5" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteUser(user.id, user.email)}
                className="p-2"
              >
                <MaterialIcons name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </StyledView>
          </StyledView>
        ))}
      </ScrollView>

      <Modal
        isVisible={editModal}
        animationIn="slideInUp"
        onBackdropPress={() => setEditModal(false)}
      >
        <StyledView className="flex-1 justify-center items-center bg-black/50">
          <StyledView className="bg-white p-4 rounded-xl w-[80%]">
            <ThemedText className="text-lg font-bold mb-4">
              Edit {editType === "name" ? "Name" : "Email"}
            </ThemedText>
            <TextInput
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
              value={editValue}
              onChangeText={setEditValue}
              autoCapitalize="none"
              keyboardType={editType === "email" ? "email-address" : "default"}
            />
            <StyledView className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setEditModal(false)}
                className="px-4 py-2"
              >
                <ThemedText className="text-gray-600">Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className="bg-[#6F13F5] px-4 py-2 rounded-lg"
              >
                <ThemedText className="text-white">Save</ThemedText>
              </TouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledSafeAreaView>
  );
}
