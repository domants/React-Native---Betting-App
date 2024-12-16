import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  //@ts-ignore
  TouchableWithoutFeedback,
  //@ts-ignore
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface BetRow {
  id: number;
  combination: string;
  isRambol: boolean;
  amount: string;
}

export default function NewBetScreen() {
  const { gameTitle, eventTime } = useLocalSearchParams<{
    gameTitle: string;
    eventTime: string;
  }>();

  const [betRows, setBetRows] = useState<BetRow[]>([
    { id: 1, combination: "", isRambol: false, amount: "" },
  ]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    router.setParams({ totalBetValue: totalAmount.toString() });
  }, [totalAmount]);

  const handleCombinationChange = (id: number, value: string) => {
    setBetRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, combination: value } : row))
    );
  };

  const handleRambolToggle = (id: number) => {
    setBetRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, isRambol: !row.isRambol } : row
      )
    );
  };

  const handleAmountChange = (id: number, value: string) => {
    setBetRows((prev) => {
      const newRows = prev.map((row) =>
        row.id === id ? { ...row, amount: value } : row
      );
      // Calculate total after updating amount
      const total = newRows.reduce((sum, row) => {
        const amount = row.amount.trim() === "" ? 0 : parseFloat(row.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      setTotalAmount(total);
      return newRows;
    });
  };

  const addNewRow = () => {
    if (betRows.length < 10) {
      setBetRows((prev) => {
        const newRows = [
          ...prev,
          {
            id: prev.length + 1,
            combination: "",
            isRambol: false,
            amount: "",
          },
        ];
        // Calculate total after updating rows
        const total = newRows.reduce((sum, row) => {
          const amount = row.amount.trim() === "" ? 0 : parseFloat(row.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        setTotalAmount(total);
        return newRows;
      });
    }
  };

  const removeRow = (id: number) => {
    setBetRows((prev) => {
      const newRows = prev.filter((row) => row.id !== id);
      // Calculate total after updating rows
      const total = newRows.reduce((sum, row) => {
        const amount = row.amount.trim() === "" ? 0 : parseFloat(row.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      setTotalAmount(total);
      return newRows;
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
        <StyledView className="flex-row items-center p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText className="ml-4 text-lg font-bold">
            New Bet ({gameTitle})
          </ThemedText>
        </StyledView>

        <StyledView className="flex-1 p-4">
          {betRows.map((row, index) => (
            <StyledView key={row.id} className="flex-row items-center mb-2">
              <ThemedText className="w-8">{index + 1}</ThemedText>
              <StyledView className="flex-1 flex-row items-center">
                <TextInput
                  className="flex-1 h-12 px-4 mr-2 border border-gray-200 rounded-lg"
                  value={row.combination}
                  onChangeText={(value: string) =>
                    handleCombinationChange(row.id, value)
                  }
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="Combination"
                />
                <TouchableOpacity
                  onPress={() => handleRambolToggle(row.id)}
                  className="flex-row items-center absolute right-4"
                >
                  <StyledView
                    className={`w-5 h-5 border rounded mr-1 items-center justify-center ${
                      row.isRambol
                        ? "bg-[#6F13F5] border-[#6F13F5]"
                        : "border-gray-400"
                    }`}
                  >
                    {row.isRambol && (
                      <MaterialIcons name="check" size={16} color="white" />
                    )}
                  </StyledView>
                  <ThemedText className="text-gray-600">R</ThemedText>
                </TouchableOpacity>
              </StyledView>
              <TextInput
                className="w-20 h-12 px-4 mr-2 border border-gray-200 rounded-lg"
                value={row.amount}
                onChangeText={(value: string) =>
                  handleAmountChange(row.id, value)
                }
                keyboardType="numeric"
                placeholder="Amount"
              />
              <TouchableOpacity onPress={() => removeRow(row.id)}>
                <MaterialIcons
                  name="remove-circle-outline"
                  size={24}
                  color="red"
                />
              </TouchableOpacity>
            </StyledView>
          ))}
        </StyledView>

        <StyledView className="p-4 border-t border-gray-200">
          <StyledView className="flex-row justify-between mb-4">
            <TouchableOpacity
              onPress={addNewRow}
              disabled={betRows.length >= 10}
              className={`py-2 px-4 rounded-full border border-[#6F13F5] ${
                betRows.length >= 10 ? "opacity-50" : ""
              }`}
            >
              <ThemedText className="text-[#6F13F5]">Add Row</ThemedText>
            </TouchableOpacity>
            <ThemedText className="text-lg font-bold">
              Total: ₱{totalAmount.toFixed(2)}
            </ThemedText>
          </StyledView>

          <TouchableOpacity
            className="w-full py-4 bg-[#6F13F5] rounded-xl items-center"
            onPress={() => {
              router.setParams({ totalBetValue: totalAmount.toString() });
              router.back();
            }}
          >
            <ThemedText className="text-white font-bold">Submit Bet</ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledSafeAreaView>
    </TouchableWithoutFeedback>
  );
}
