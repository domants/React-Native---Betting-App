import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";
import * as crypto from "expo-crypto";
import NetInfo from "@react-native-community/netinfo";
import { generatePermutations } from "./utils/permutations";

// Polyfill for crypto.getRandomValues
(globalThis as any).crypto = {
  getRandomValues: (array: Uint8Array) => {
    return crypto.getRandomValues(array);
  },
};

// environment variables
const supabaseUrl = "https://hqwxmqqsmofpevnzycrx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd3htcXFzbW9mcGV2bnp5Y3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMzA2MTUsImV4cCI6MjA1MzYwNjYxNX0.5kbCIKW_ExL-qXyMNQIIj8aYOMq_GZ7-YV5qbp89EeM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
  name?: string;
  role: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
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

// New interfaces for admin functionality
export interface GameResult {
  id: string;
  game_type: "last_two" | "swertres";
  draw_time: string;
  winning_number: string;
  created_by: string;
  created_at: string;
}

export interface CoordinatorAccount {
  id: string;
  user_id: string;
  created_by: string;
  percentage_last_two: number;
  percentage_swertres: number;
  winnings_last_two: number;
  winnings_swertres: number;
  created_at: string;
  updated_at: string;
}

// helper function at the top of the file
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
export async function createBet(betData: {
  user_id: string;
  combination: string;
  amount: number;
  is_rumble: boolean;
  game_title: string;
  draw_time: string;
  bet_date: string;
}) {
  try {
    if (betData.is_rumble && betData.game_title === "SWERTRES") {
      // Generate all permutations
      const permutations = generatePermutations(betData.combination);
      const amountPerCombination = betData.amount / permutations.length;

      // Create an array of bet records
      const betRecords = permutations.map((combination) => ({
        user_id: betData.user_id,
        combination,
        amount: amountPerCombination,
        is_rumble: true,
        game_title: betData.game_title,
        draw_time: betData.draw_time,
        bet_date: betData.bet_date,
        original_combination: betData.combination, // Add this to track original input
      }));

      // Insert all permutations
      const { data, error } = await supabase
        .from("bets")
        .insert(betRecords)
        .select();

      if (error) throw error;
      return { data, error: null };
    } else {
      // Regular non-rumble bet
      const { data, error } = await supabase
        .from("bets")
        .insert([betData])
        .select();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error("Error in createBet:", error);
    return { data: null, error };
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

// Admin specific functions
export async function createCoordinator(data: {
  username: string;
  password: string;
  percentageL2: number;
  percentageL3: number;
  winningsL2: number;
  winningsL3: number;
}) {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `${data.username}@example.com`,
    password: data.password,
  });

  if (authError) throw authError;

  // Then create the coordinator profile
  const { data: coordinator, error: profileError } = await supabase
    .from("users")
    .insert({
      id: authData.user?.id,
      username: data.username,
      email: `${data.username}@example.com`,
      role: "coordinator",
      percentage_l2: data.percentageL2,
      percentage_l3: data.percentageL3,
      winnings_l2: data.winningsL2,
      winnings_l3: data.winningsL3,
    })
    .select()
    .single();

  if (profileError) {
    // Cleanup auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user?.id as string);
    throw profileError;
  }

  return coordinator;
}

export async function addGameResult(
  result: Omit<GameResult, "id" | "created_at">
) {
  const { data: newResult, error } = await supabase
    .from("game_results")
    .insert(result)
    .select()
    .single();

  if (error) throw error;
  return newResult;
}

export async function updateGameLimits(
  gameType: "last_two" | "swertres",
  limits: { max_bet: number; number_limits: { [key: string]: number } }
) {
  const { data: updatedLimits, error } = await supabase
    .from("game_limits")
    .upsert({
      game_type: gameType,
      ...limits,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return updatedLimits;
}

export async function getDailyBets(date: string) {
  const { data: bets, error } = await supabase
    .from("user_bets")
    .select(
      `
      *,
      bet_details(*),
      users!inner(username, role)
    `
    )
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`);

  if (error) throw error;
  return bets;
}

export async function getCoordinators() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "coordinator");

  if (error) throw error;
  return data;
}

// Add this helper function to check user roles
export async function getCurrentUser() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    throw new Error("User profile not found");
  }

  return userData;
}

// Add role check helper functions
export function canCreateCoordinator(userRole: string) {
  return userRole === "Admin";
}

export function canCreateSubCoordinator(userRole: string) {
  return ["Admin", "Coordinator"].includes(userRole);
}

export function canCreateUsher(userRole: string) {
  return ["Admin", "Coordinator", "Sub-Coordinator"].includes(userRole);
}

export function canViewAllBets(userRole: string) {
  return ["Admin", "Coordinator", "Sub-Coordinator"].includes(userRole);
}

export function canAddBets(userRole: string) {
  return ["Coordinator", "Sub-Coordinator", "Usher"].includes(userRole);
}

export function canManageGameSettings(userRole: string) {
  return userRole === "Admin";
}

// Add this new function
export async function assignPercentage(data: {
  userId: string;
  gameType: "L2" | "3D";
  percentage: number;
  winnings: number;
}) {
  const { data: result, error } = await supabase
    .from("users")
    .update({
      [`percentage_${data.gameType.toLowerCase()}`]: data.percentage,
      [`winnings_${data.gameType.toLowerCase()}`]: data.winnings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.userId)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Update the checkBetLimit function
export async function checkBetLimit(
  combination: string,
  amount: number,
  gameTitle: string,
  betDate: string
) {
  try {
    const formattedCombination = combination.padStart(
      gameTitle === "LAST TWO" ? 2 : 3,
      "0"
    );

    // Get the exact limit
    const { data: limits, error } = await supabase
      .from("bet_limits")
      .select("*")
      .eq("bet_date", betDate)
      .eq("game_title", gameTitle)
      .eq("number", formattedCombination)
      .single();

    console.log("Limit check details:", {
      searchParams: {
        bet_date: betDate,
        game_title: gameTitle,
        number: formattedCombination,
      },
      foundLimit: limits,
      error: error,
    });

    if (error && error.code !== "PGRST116") {
      // Not found error code
      console.error("Error checking limit:", error);
      return { allowed: true }; // Default to allowed on error
    }

    if (limits) {
      const isAllowed = amount <= limits.limit_amount;
      console.log("Limit evaluation:", {
        betAmount: amount,
        limitAmount: limits.limit_amount,
        isAllowed,
      });

      return {
        allowed: isAllowed,
        limitAmount: limits.limit_amount,
      };
    }

    // No limit found for this combination
    console.log("No limit found for this combination");
    return { allowed: true };
  } catch (error) {
    console.error("Error in checkBetLimit:", error);
    return { allowed: true };
  }
}
