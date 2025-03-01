import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";

const StyledView = styled(View);
const StyledSafeAreaView = styled(SafeAreaView);

interface LimitRow {
  id: string;
  combination: string;
  limitAmount: string;
  gameTitle: "LAST TWO" | "SWERTRES";
}

export default function LimitsScreen() {
  const [betDate, setBetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastTwoRows, setLastTwoRows] = useState<LimitRow[]>([
    { id: "1", combination: "", limitAmount: "", gameTitle: "LAST TWO" },
  ]);
  const [swertresRows, setSwertresRows] = useState<LimitRow[]>([
    { id: "1", combination: "", limitAmount: "", gameTitle: "SWERTRES" },
  ]);
  const [activeGameType, setActiveGameType] = useState<"LAST TWO" | "SWERTRES">(
    "LAST TWO"
  );

  const currentRows =
    activeGameType === "LAST TWO" ? lastTwoRows : swertresRows;
  const setCurrentRows =
    activeGameType === "LAST TWO" ? setLastTwoRows : setSwertresRows;

  const addNewRow = () => {
    if (currentRows.length >= 10) return;
    const newRow: LimitRow = {
      id: (currentRows.length + 1).toString(),
      combination: "",
      limitAmount: "",
      gameTitle: activeGameType,
    };
    setCurrentRows([...currentRows, newRow]);
  };

  const handleCombinationChange = (id: string, value: string) => {
    setCurrentRows(
      currentRows.map((row) => {
        if (row.id === id) {
          return { ...row, combination: value };
        }
        return row;
      })
    );
  };

  const handleLimitAmountChange = (id: string, value: string) => {
    setCurrentRows(
      currentRows.map((row) => {
        if (row.id === id) {
          return { ...row, limitAmount: value };
        }
        return row;
      })
    );
  };

  const handleGameTypeChange = (newType: "LAST TWO" | "SWERTRES") => {
    setActiveGameType(newType);
  };

  const handleSetLimits = async () => {
    try {
      // Combine both game type rows for processing
      const allRows = [...lastTwoRows, ...swertresRows];

      for (const row of allRows) {
        if (!row.combination || !row.limitAmount) continue;

        const maxLength = row.gameTitle === "LAST TWO" ? 2 : 3;
        if (row.combination.length !== maxLength) {
          Alert.alert(
            "Invalid Number",
            `${row.gameTitle} number must be ${maxLength} digits`
          );
          return;
        }

        // Check for existing limit
        const { data: existingLimit } = await supabase
          .from("bet_limits")
          .select("*")
          .eq("bet_date", betDate.toISOString().split("T")[0])
          .eq("game_title", row.gameTitle)
          .eq("number", row.combination)
          .single();

        if (existingLimit) {
          Alert.alert(
            "Limit Already Exists",
            `A limit for ${row.gameTitle} number ${row.combination} already exists:\n\n` +
              `Current Limit: ₱${existingLimit.limit_amount.toLocaleString()}\n` +
              `New Limit: ₱${parseFloat(
                row.limitAmount
              ).toLocaleString()}\n\n` +
              `Would you like to update it?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Update",
                onPress: async () => {
                  const { error: updateError } = await supabase
                    .from("bet_limits")
                    .update({ limit_amount: parseFloat(row.limitAmount) })
                    .eq("id", existingLimit.id);

                  if (updateError) throw updateError;
                },
              },
            ]
          );
          continue;
        }

        // Insert new limit
        const { error } = await supabase.from("bet_limits").insert({
          bet_date: betDate.toISOString().split("T")[0],
          game_title: row.gameTitle,
          number: row.combination,
          limit_amount: parseFloat(row.limitAmount),
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error setting limits:", error);
      Alert.alert("Error", "An error occurred while setting limits.");
    }
  };

  return (
    <StyledSafeAreaView className="flex-1">
      {/* Rest of the component code remains unchanged */}
    </StyledSafeAreaView>
  );
}
