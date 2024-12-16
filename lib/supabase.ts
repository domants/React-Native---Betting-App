import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";
import * as crypto from "expo-crypto";
import NetInfo from "@react-native-community/netinfo";

// Polyfill for crypto.getRandomValues
(globalThis as any).crypto = {
  getRandomValues: (array: Uint8Array) => {
    return crypto.getRandomValues(array);
  },
};

export const supabaseUrl = "https://koclapmkkvjxfcdvywrd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvY2xhcG1ra3ZqeGZjZHZ5d3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMTg2OTUsImV4cCI6MjA0OTg5NDY5NX0.u8sQNk_nLU5E5SMOkNVMDywiwmWLHHEaEbIP3t8d8yE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// Add connection handling
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    // Reconnect Supabase if needed
    supabase.auth.startAutoRefresh();
  } else {
    // Pause auto-refresh when offline
    supabase.auth.stopAutoRefresh();
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    router.replace("/(auth)/update-password");
  }

  // Handle connection changes
  if (event === "SIGNED_IN") {
    supabase.auth.startAutoRefresh();
  } else if (event === "SIGNED_OUT") {
    supabase.auth.stopAutoRefresh();
  }
});

// Define types for your database tables
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
  role: string;
  balance: number;
}

export interface UserBet {
  id: string;
  user_id: string;
  game_title: string;
  event_time: string;
  total_amount: number;
  status: "pending" | "submitted" | "won" | "lost";
  created_at: string;
  updated_at: string;
}

export interface BetDetail {
  id: string;
  user_bet_id: string;
  combination: string;
  amount: number;
  is_rambol: boolean;
  created_at: string;
}

// Add this helper function at the top of the file
function convertTimeToTimestamp(timeStr: string): string {
  const today = new Date();
  const [time, period] = timeStr.split(" ");
  const [hours, minutes] = time.split(":");

  // Convert to 24-hour format
  let hour = parseInt(hours);
  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  // Set the time
  today.setHours(hour);
  today.setMinutes(parseInt(minutes));
  today.setSeconds(0);
  today.setMilliseconds(0);

  // Return ISO string
  return today.toISOString();
}

// Example function to create a new bet
export async function createBet(
  gameTitle: string,
  eventTime: string,
  betDetails: Array<{
    combination: string;
    amount: number;
    is_rambol: boolean;
  }>
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    console.log("Creating bet for user:", user.id);
    console.log("Bet details:", { gameTitle, eventTime, betDetails });

    // Convert the time string to a proper timestamp
    const timestamp = convertTimeToTimestamp(eventTime);
    console.log("Converted timestamp:", timestamp);

    // Create the bet data object
    const betData = {
      user_id: user.id,
      game_title: gameTitle,
      event_time: timestamp, // Use the converted timestamp
      total_amount: betDetails.reduce((sum, detail) => sum + detail.amount, 0),
      status: "pending",
    };

    console.log("Inserting bet with data:", betData);

    // Start a transaction
    const { data: userBet, error: betError } = await supabase
      .from("user_bets")
      .insert(betData)
      .select()
      .single();

    if (betError) {
      console.error("Error creating user_bet:", {
        error: betError,
        code: betError.code,
        message: betError.message,
        details: betError.details,
        hint: betError.hint,
      });
      throw new Error(`Failed to create bet: ${betError.message}`);
    }

    if (!userBet) {
      throw new Error("Bet was created but no data was returned");
    }

    console.log("Created user_bet:", userBet);

    // Prepare bet details data
    const betDetailsData = betDetails.map((detail) => ({
      user_bet_id: userBet.id,
      combination: detail.combination,
      amount: Number(detail.amount),
      is_rambol: detail.is_rambol ?? false,
    }));

    // Add validation before insert
    if (
      betDetailsData.some(
        (detail) => detail.is_rambol === null || detail.is_rambol === undefined
      )
    ) {
      throw new Error("Invalid bet details: is_rambol must be specified");
    }

    console.log("Inserting bet details:", betDetailsData);

    // Insert bet details
    const { data: details, error: detailsError } = await supabase
      .from("bet_details")
      .insert(betDetailsData)
      .select();

    if (detailsError) {
      console.error("Error creating bet_details:", {
        error: detailsError,
        code: detailsError.code,
        message: detailsError.message,
        details: detailsError.details,
        hint: detailsError.hint,
      });
      throw new Error(`Failed to create bet details: ${detailsError.message}`);
    }

    console.log("Created bet_details:", details);
    return userBet;
  } catch (error) {
    console.error("Detailed error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Example function to get user's bets
export async function getUserBets() {
  const { data: bets, error } = await supabase
    .from("user_bets")
    .select(
      `
      *,
      bet_details:bet_details(*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return bets;
}

// Add these functions to verify bets

// Get a specific bet by ID
export async function getBetById(betId: string) {
  const { data, error } = await supabase
    .from("user_bets")
    .select(
      `
      *,
      bet_details:bet_details(*)
    `
    )
    .eq("id", betId)
    .single();

  if (error) throw error;
  return data;
}

// Get all bets for the current user
export async function getCurrentUserBets() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("user_bets")
    .select(
      `
      *,
      bet_details:bet_details(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export interface BetSummary {
  user_id: string;
  total_bets: number;
  total_wins: number;
  total_losses: number;
  pending_bets: number;
  total_stake: number;
  total_winnings: number;
  profit_loss: number;
}

export async function fetchBetSummary(userId: string): Promise<BetSummary> {
  const { data, error } = await supabase
    .from("bet_summary_view")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("No data found");

  return data as BetSummary;
}
