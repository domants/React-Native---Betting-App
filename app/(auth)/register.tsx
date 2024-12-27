import { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { styled } from "nativewind";

import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/lib/supabase";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("usher");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user's role
  useEffect(() => {
    async function fetchCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("Users")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentUser(data);
      }
    }
    fetchCurrentUser();
  }, []);

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (!currentUser) {
      // If no user is logged in, only allow usher registration
      return [{ label: "Usher", value: "usher" }];
    }

    switch (currentUser.role) {
      case "admin":
        return [{ label: "Coordinator", value: "coordinator" }];
      case "coordinator":
        return [
          { label: "Sub-Coordinator", value: "sub_coordinator" },
          { label: "Usher", value: "usher" },
        ];
      case "sub_coordinator":
        return [{ label: "Usher", value: "usher" }];
      default:
        return []; // Ushers cannot create accounts
    }
  };

  const handleRegister = async () => {
    if (!email || !username || !password || !role) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Validate role creation permissions
    const availableRoles = getAvailableRoles();
    if (!availableRoles.some((r) => r.value === role)) {
      Alert.alert("Error", "You don't have permission to create this role");
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: existingUser, error: checkError } = await supabase
          .from("Users")
          .select("username")
          .eq("username", username)
          .single();

        if (existingUser) {
          Alert.alert("Error", "Username already taken");
          return;
        }

        // Create the user record with both role columns
        const { error: userError } = await supabase.from("Users").insert([
          {
            id: authData.user.id,
            email: email,
            username: username,
            display_name: username,
            role: role,
            user_role: role,
            balance: 0,
            percentage_l2: 0,
            percentage_l3: 0,
            winnings_l2: 0,
            winnings_l3: 0,
            parent_id: currentUser?.id,
          },
        ]);

        if (userError) {
          console.error("User creation error:", userError);
          throw userError;
        }

        Alert.alert("Success", "Registration successful!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        <ThemedText className="text-2xl font-bold mb-8">
          Create Account
        </ThemedText>

        <View className="space-y-6">
          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Username</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Email</ThemedText>
            <TextInput
              className="bg-white p-4 rounded-lg text-base text-black border border-gray-200"
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
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

          <View className="space-y-2">
            <ThemedText className="text-base font-medium">Role</ThemedText>
            <View className="border border-gray-200 rounded-lg">
              <Picker
                selectedValue={role}
                onValueChange={(itemValue: string) => setRole(itemValue)}
                style={{
                  height: 50,
                  width: "100%",
                  marginHorizontal: -8,
                }}
                itemStyle={{ fontSize: 16 }}
                enabled={getAvailableRoles().length > 0}
              >
                {getAvailableRoles().map((role) => (
                  <Picker.Item
                    key={role.value}
                    label={role.label}
                    value={role.value}
                    color="#000"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            className="bg-[#6F13F5] p-4 rounded-lg items-center mt-4"
            onPress={handleRegister}
          >
            <ThemedText className="text-white text-base font-semibold">
              Create Account
            </ThemedText>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <ThemedText className="text-gray-500">
              Already have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <ThemedText className="text-[#6F13F5] font-medium">
                Log in
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
