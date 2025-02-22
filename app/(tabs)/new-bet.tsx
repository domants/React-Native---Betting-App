import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  //@ts-ignore
  TouchableWithoutFeedback,
  //@ts-ignore
  Keyboard,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useNavigation } from "@react-navigation/native";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();

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

  const handleSubmitBet = () => {
    try {
      if (!betRows.some((row) => row.combination && row.amount)) {
        Alert.alert("Error", "Please add at least one bet");
        return;
      }

      // Format bets for passing back to dashboard
      const formattedBets = betRows
        .filter((row) => row.combination && row.amount)
        .map((row) => ({
          combination: row.combination,
          amount: Number(row.amount),
          is_rumble: row.isRambol,
          game_title: gameTitle,
          draw_time: eventTime,
        }));

      // Pass back to dashboard
      router.setParams({
        totalBetValue: totalAmount.toString(),
        betDetails: JSON.stringify(formattedBets),
      });
      router.back();
    } catch (error) {
      console.error("Error formatting bets:", error);
      Alert.alert("Error", "Failed to prepare bets. Please try again.");
    }
  };

  const handleBack = () => {
    // Only update params and go back without alert
    const formattedBetRows = betRows.map((row) => ({
      combination: row.combination,
      amount: Number(row.amount),
      is_rambol: row.isRambol,
    }));

    router.setParams({
      totalBetValue: totalAmount.toString(),
      betDetails: JSON.stringify(formattedBetRows),
    });
    router.back();
  };

  const resetBetForm = () => {
    setBetRows([{ id: 1, combination: "", isRambol: false, amount: "" }]);
    setTotalAmount(0);
    setIsSubmitting(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Reset form when screen comes into focus
      resetBetForm();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <StyledSafeAreaView className="flex-1 bg-[#FDFDFD]">
        <StyledView className="flex-row items-center p-4 border-b border-gray-200">
          <TouchableOpacity onPress={handleBack}>
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
                  onChangeText={(value: string) => {
                    // Only allow numbers and limit based on game type
                    const numericValue = value.replace(/[^0-9]/g, "");
                    if (gameTitle?.includes("LAST TWO")) {
                      // For LAST TWO: limit to 2 digits and max value of 99
                      if (
                        numericValue.length <= 2 &&
                        parseInt(numericValue || "0") <= 99
                      ) {
                        handleCombinationChange(row.id, numericValue);
                      }
                    } else {
                      // For SWERTRES: limit to 3 digits
                      if (numericValue.length <= 3) {
                        handleCombinationChange(row.id, numericValue);
                      }
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={gameTitle?.includes("LAST TWO") ? 2 : 3}
                  placeholder="Combination"
                />
                {!gameTitle?.includes("LAST TWO") && (
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
                )}
                {!gameTitle?.includes("LAST TWO") && row.isRambol && (
                  <ThemedText className="text-sm font-bold text-[#6F13F5]">
                    R
                  </ThemedText>
                )}
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
              className={`h-10 px-4 rounded-full border border-[#6F13F5] flex-row items-center justify-center space-x-1 w-24 ${
                betRows.length >= 10 ? "opacity-50" : ""
              }`}
            >
              <ThemedText className="text-[#6F13F5] text-sm">Add</ThemedText>
              <MaterialIcons
                name="add-circle-outline"
                size={17}
                color="#6F13F5"
              />
            </TouchableOpacity>
            <ThemedText className="text-lg font-bold">
              Total: ₱{totalAmount.toFixed(2)}
            </ThemedText>
          </StyledView>

          <TouchableOpacity
            className="w-full py-4 bg-[#6F13F5] rounded-xl items-center"
            onPress={handleSubmitBet}
            disabled={isSubmitting}
          >
            <ThemedText className="text-white font-bold">
              {isSubmitting ? "Submitting..." : "Add Bet"}
            </ThemedText>
          </TouchableOpacity>
        </StyledView>
      </StyledSafeAreaView>
    </TouchableWithoutFeedback>
  );
}
