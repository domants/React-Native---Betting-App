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
import { checkBetLimit, createBet } from "@/lib/supabase";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { generatePermutations } from "@/lib/utils/permutations";
import { supabase } from "@/lib/supabase";

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

// Add interface for bet type
interface Bet {
  combination: string;
  amount: number;
  is_rumble: boolean;
  game_title: string;
  draw_time: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function NewBetScreen() {
  // Get route params including existing bets and reset flag
  const { gameTitle, eventTime, existingBets, shouldResetForm } =
    useLocalSearchParams<{
      gameTitle: string;
      eventTime: string;
      existingBets?: string;
      shouldResetForm?: string;
    }>();

  const [betRows, setBetRows] = useState<BetRow[]>([
    { id: 1, combination: "", isRambol: false, amount: "" },
  ]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();

  const resetBetForm = () => {
    setBetRows([{ id: 1, combination: "", isRambol: false, amount: "" }]);
    setTotalAmount(0);
    setIsSubmitting(false);
  };

  // Effect to load existing bets
  useEffect(() => {
    if (existingBets) {
      try {
        const allBets = JSON.parse(existingBets);
        // If empty array, reset form
        if (allBets.length === 0) {
          resetBetForm();
          return;
        }

        const gameBets = allBets
          .filter((bet: Bet) => bet.game_title === gameTitle)
          .map((bet: Bet, index: number) => ({
            id: index + 1,
            combination: bet.combination,
            isRambol: bet.is_rumble,
            amount: bet.amount.toString(),
          }));

        if (gameBets.length > 0) {
          setBetRows(gameBets);
          const total = gameBets.reduce(
            (sum: number, row: BetRow) => sum + Number(row.amount),
            0
          );
          setTotalAmount(total);
        } else {
          resetBetForm();
        }
      } catch (error) {
        console.error("Error parsing existing bets:", error);
        resetBetForm();
      }
    }
  }, [gameTitle, existingBets]);

  // Effect to handle form reset
  useEffect(() => {
    if (shouldResetForm === "true") {
      resetBetForm();
    }
  }, [shouldResetForm]);

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

  const validateBetLimits = async (bets: BetRow[]) => {
    const today = new Date();
    const currentDate = today.toISOString().slice(0, 10);

    console.log("Starting bet limit validation:", {
      date: currentDate,
      totalBets: bets.length,
      gameTitle,
    });

    for (const bet of bets) {
      if (!bet.combination || !bet.amount) continue;

      const formattedCombination = bet.combination.padStart(
        gameTitle?.includes("LAST TWO") ? 2 : 3,
        "0"
      );

      console.log("Processing bet:", {
        original: bet.combination,
        formatted: formattedCombination,
        amount: parseFloat(bet.amount),
        gameTitle,
        currentDate,
        rawAmount: bet.amount,
      });

      const { allowed, limitAmount } = await checkBetLimit(
        formattedCombination,
        parseFloat(bet.amount),
        gameTitle,
        currentDate
      );

      console.log("Limit check response:", {
        allowed,
        limitAmount,
        combination: formattedCombination,
      });

      if (!allowed && limitAmount !== undefined) {
        // Return a Promise that resolves when the alert is acknowledged
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            "Bet Limit Exceeded",
            `Combination ${formattedCombination} has a limit of ₱${limitAmount}. Your bet amount (₱${bet.amount}) exceeds this limit.`,
            [
              {
                text: "OK",
                onPress: () => {
                  console.log("User acknowledged limit exceeded");
                  resolve(false);
                },
              },
            ],
            { cancelable: false }
          );
        });
      }
    }
    return true;
  };

  const handleSubmitBet = async () => {
    try {
      setIsSubmitting(true);

      // Validate all rows
      for (const row of betRows) {
        if (!row.combination || !row.amount) {
          Alert.alert("Error", "Please fill in all fields");
          setIsSubmitting(false);
          return;
        }

        // Validate combination length
        const requiredLength = gameTitle?.includes("LAST TWO") ? 2 : 3;
        if (row.combination.length !== requiredLength) {
          Alert.alert(
            "Error",
            `Combination must be ${requiredLength} digits for ${gameTitle}`
          );
          setIsSubmitting(false);
          return;
        }

        // Check for triple numbers when rambol is selected
        if (row.isRambol && gameTitle === "SWERTRES") {
          const isTriple =
            row.combination[0] === row.combination[1] &&
            row.combination[1] === row.combination[2];

          if (isTriple) {
            Alert.alert(
              "Invalid Combination",
              "Triple numbers (e.g., 111) cannot be rambolized."
            );
            setIsSubmitting(false);
            return;
          }

          // Get permutations to determine if it's a double number
          const permutations = generatePermutations(row.combination);
          const amountPerCombination = Number(row.amount) / permutations.length;

          // Update amount based on number of permutations
          row.amount = amountPerCombination.toString();
        }

        // Check bet limits
        const { allowed, limitAmount } = await checkBetLimit(
          row.combination,
          Number(row.amount),
          gameTitle || "",
          formatDate(new Date())
        );

        if (!allowed) {
          Alert.alert(
            "Limit Exceeded",
            `Maximum bet for ${row.combination} is ₱${limitAmount}`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Create the bets array for the dashboard (without saving to database)
      const newBets = betRows.map((row) => {
        if (row.isRambol && gameTitle === "SWERTRES") {
          const permutations = generatePermutations(row.combination);
          const amountPerCombination = Number(row.amount) / permutations.length;

          return {
            combination: row.combination,
            amount: Number(row.amount) * permutations.length, // Store total amount
            is_rumble: row.isRambol,
            game_title: gameTitle,
            draw_time: eventTime,
            permutations: permutations, // Store permutations for reference
          };
        }

        return {
          combination: row.combination,
          amount: Number(row.amount),
          is_rumble: row.isRambol,
          game_title: gameTitle,
          draw_time: eventTime,
        };
      });

      // Get existing bets and update them
      let allBets: Bet[] = existingBets ? JSON.parse(existingBets) : [];
      allBets = [...allBets, ...newBets];

      // Calculate total
      const totalBetAmount = allBets.reduce(
        (sum: number, bet: Bet) => sum + Number(bet.amount),
        0
      );

      // Update params and go back
      router.setParams({
        totalBetValue: totalBetAmount.toString(),
        betDetails: JSON.stringify(allBets),
      });
      router.back();
    } catch (error) {
      console.error("Error validating bets:", error);
      Alert.alert("Error", "Failed to validate bets. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // If there are unsaved changes, maybe show a confirmation dialog
    router.back();
  };

  useEffect(() => {
    // No reset on focus
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
              <StyledView className="flex-1 flex-row items-center mr-2">
                <TextInput
                  className="flex-1 h-12 px-4 border border-gray-200 rounded-lg"
                  value={row.combination}
                  onChangeText={(value: string) => {
                    // Only allow numbers and limit based on game type
                    const numericValue = value.replace(/[^0-9]/g, "");
                    if (gameTitle?.includes("LAST TWO")) {
                      if (
                        numericValue.length <= 2 &&
                        parseInt(numericValue || "0") <= 99
                      ) {
                        handleCombinationChange(row.id, numericValue);
                      }
                    } else {
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

              {/* Amount input with fixed width */}
              <TextInput
                className="w-[25%] h-12 px-4 border border-gray-200 rounded-lg mr-2"
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
