import { View, TouchableOpacity, TextInput, Alert } from "react-native";
import Modal from "react-native-modal";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface AccountAllocation {
  id: string;
  name: string;
  role: string;
  l2Percentage: number;
  l2Winnings: number;
  d3Percentage: number;
  d3Winnings: number;
}

export default function PercentageScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [l2Percentage, setL2Percentage] = useState("");
  const [d3Percentage, setD3Percentage] = useState("");
  const [l2Winnings, setL2Winnings] = useState("");
  const [d3Winnings, setD3Winnings] = useState("");

  const [allocations, setAllocations] = useState<AccountAllocation[]>([
    {
      id: "1",
      name: "Coordinator 1",
      role: "Coordinator",
      l2Percentage: 30,
      l2Winnings: 4000,
      d3Percentage: 20,
      d3Winnings: 3000,
    },
  ]);

  // Calculate remaining allocations
  const totalL2Percentage = allocations.reduce(
    (sum, acc) => sum + acc.l2Percentage,
    0
  );
  const totalL2Winnings = allocations.reduce(
    (sum, acc) => sum + acc.l2Winnings,
    0
  );
  const totalD3Percentage = allocations.reduce(
    (sum, acc) => sum + acc.d3Percentage,
    0
  );
  const totalD3Winnings = allocations.reduce(
    (sum, acc) => sum + acc.d3Winnings,
    0
  );

  const remainingL2Percentage = 40;
  const remainingL2Winnings = 5000;
  const remainingD3Percentage = 60;
  const remainingD3Winnings = 6000;

  // Account type options
  const accountTypeOptions = [
    { label: "Coordinator", value: "coordinator" },
    { label: "Sub-Coordinator", value: "sub_coordinator" },
    { label: "Usher", value: "usher" },
  ];

  const resetForm = () => {
    setName("");
    setAccountType("");
    setL2Percentage("");
    setD3Percentage("");
    setL2Winnings("");
    setD3Winnings("");
    setIsEditing(false);
    setSelectedId(null);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const handleEdit = (account: AccountAllocation) => {
    setIsEditing(true);
    setSelectedId(account.id);
    setName(account.name);
    setAccountType(account.role.toLowerCase());
    setL2Percentage(account.l2Percentage.toString());
    setD3Percentage(account.d3Percentage.toString());
    setL2Winnings(account.l2Winnings.toString());
    setD3Winnings(account.d3Winnings.toString());
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAllocations((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const handleSave = () => {
    const newAllocation = {
      id: isEditing ? selectedId! : Date.now().toString(),
      name,
      role: accountType.charAt(0).toUpperCase() + accountType.slice(1),
      l2Percentage: Number(l2Percentage),
      l2Winnings: Number(l2Winnings),
      d3Percentage: Number(d3Percentage),
      d3Winnings: Number(d3Winnings),
    };

    if (isEditing) {
      setAllocations((prev) =>
        prev.map((item) => (item.id === selectedId ? newAllocation : item))
      );
    } else {
      setAllocations((prev) => [...prev, newAllocation]);
    }

    handleCloseModal();
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
      <ScrollView className="flex-1">
        <StyledView className="p-4">
          {/* Header */}
          <StyledView className="mb-6">
            <StyledView className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <MaterialIcons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <ThemedText className="text-2xl font-bold">
                Assign Percentage & Winnings
              </ThemedText>
            </StyledView>
            <TouchableOpacity
              className="bg-black py-3 rounded-lg"
              onPress={() => setIsModalVisible(true)}
            >
              <ThemedText className="text-white text-center font-semibold">
                Assign Allocation
              </ThemedText>
            </TouchableOpacity>
          </StyledView>

          {/* Cards Container */}
          <StyledView className="space-y-4">
            {/* Remaining Allocation Card */}
            <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <ThemedText className="text-xl font-bold mb-4">
                Remaining Allocation
              </ThemedText>
              <StyledView className="flex-row justify-between">
                <StyledView>
                  <ThemedText className="font-bold mb-1">L2</ThemedText>
                  <ThemedText className="text-gray-600">
                    Percentage: {remainingL2Percentage}%
                  </ThemedText>
                  <ThemedText className="text-gray-600">
                    Winnings: ₱{remainingL2Winnings}
                  </ThemedText>
                </StyledView>
                <StyledView>
                  <ThemedText className="font-bold mb-1">3D</ThemedText>
                  <ThemedText className="text-gray-600">
                    Percentage: {remainingD3Percentage}%
                  </ThemedText>
                  <ThemedText className="text-gray-600">
                    Winnings: ₱{remainingD3Winnings}
                  </ThemedText>
                </StyledView>
              </StyledView>
            </StyledView>

            {/* Account Allocations */}
            <StyledView className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <ThemedText className="text-xl font-bold mb-4">
                Account Allocations
              </ThemedText>
              <StyledView className="space-y-3">
                {allocations.map((account) => (
                  <StyledView
                    key={account.id}
                    className="p-4 rounded-lg border border-gray-100"
                  >
                    <StyledView className="flex-row justify-between items-center mb-2">
                      <StyledView>
                        <ThemedText className="font-bold">
                          {account.name}
                        </ThemedText>
                        <ThemedText className="text-gray-600">
                          {account.role}
                        </ThemedText>
                      </StyledView>
                      <StyledView className="flex-row">
                        <TouchableOpacity
                          onPress={() => handleEdit(account)}
                          className="mr-2"
                        >
                          <MaterialIcons name="edit" size={24} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(account.id)}
                        >
                          <MaterialIcons name="delete" size={24} color="#666" />
                        </TouchableOpacity>
                      </StyledView>
                    </StyledView>
                    <StyledView className="flex-row justify-between">
                      <ThemedText className="text-gray-600">
                        L2: {account.l2Percentage}%{"\n"}₱{account.l2Winnings}
                      </ThemedText>
                      <ThemedText className="text-gray-600">
                        3D: {account.d3Percentage}%{"\n"}₱{account.d3Winnings}
                      </ThemedText>
                    </StyledView>
                  </StyledView>
                ))}
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>
      </ScrollView>

      {/* Create Account Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        useNativeDriver
        style={{ margin: 0 }}
      >
        <StyledView className="flex-1 bg-black/50 justify-center">
          <StyledView className="bg-white mx-4 rounded-xl p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-xl font-bold">
                Assign Allocation
              </ThemedText>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </StyledView>

            <ScrollView>
              <StyledView className="space-y-4">
                {/* Name Input */}
                <StyledView>
                  <ThemedText className="text-base mb-2">Name</ThemedText>
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter name"
                  />
                </StyledView>

                {/* Updated Account Type Dropdown */}
                <StyledView>
                  <ThemedText className="text-base mb-2">
                    Account Type
                  </ThemedText>
                  <Dropdown
                    data={accountTypeOptions}
                    labelField="label"
                    valueField="value"
                    value={accountType}
                    onChange={(item) => setAccountType(item.value)}
                    placeholder="Select account type"
                    style={{
                      height: 50,
                      borderColor: "#E5E7EB",
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                    }}
                  />
                </StyledView>

                {/* L2 Percentage */}
                <StyledView>
                  <ThemedText className="text-base mb-2">
                    L2 Percentage (0%)
                  </ThemedText>
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3"
                    value={l2Percentage}
                    onChangeText={setL2Percentage}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </StyledView>

                {/* 3D Percentage */}
                <StyledView>
                  <ThemedText className="text-base mb-2">
                    3D Percentage (0%)
                  </ThemedText>
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3"
                    value={d3Percentage}
                    onChangeText={setD3Percentage}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </StyledView>

                {/* L2 Winnings */}
                <StyledView>
                  <ThemedText className="text-base mb-2">
                    L2 Winnings (₱)
                  </ThemedText>
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3"
                    value={l2Winnings}
                    onChangeText={setL2Winnings}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </StyledView>

                {/* 3D Winnings */}
                <StyledView>
                  <ThemedText className="text-base mb-2">
                    3D Winnings (₱)
                  </ThemedText>
                  <TextInput
                    className="border border-gray-200 rounded-lg p-3"
                    value={d3Winnings}
                    onChangeText={setD3Winnings}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </StyledView>

                {/* Updated Save Button */}
                <TouchableOpacity
                  className="bg-black py-3 rounded-lg mt-4"
                  onPress={handleSave}
                >
                  <ThemedText className="text-white text-center font-semibold">
                    {isEditing ? "Update Allocation" : "Assign Allocation"}
                  </ThemedText>
                </TouchableOpacity>
              </StyledView>
            </ScrollView>
          </StyledView>
        </StyledView>
      </Modal>
    </StyledSafeAreaView>
  );
}
