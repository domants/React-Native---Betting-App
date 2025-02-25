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
    // Check auth status
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    console.log("Auth check:", {
      isAuthenticated: !!session,
      userId: session?.user?.id,
      error: authError,
    });

    // First, let's verify the table contents with a raw query
    const { data: rawData, error: rawError } = await supabase.rpc(
      "debug_bet_limits",
      {
        debug_date: betDate,
      }
    );

    console.log("Raw table data:", {
      data: rawData,
      error: rawError,
    });

    const formattedCombination = combination.padStart(
      gameTitle === "LAST TWO" ? 2 : 3,
      "0"
    );

    // Try direct table access with detailed error logging
    const { data: allLimits, error: queryError } = await supabase
      .from("bet_limits")
      .select("*");

    console.log("Direct table query:", {
      success: !queryError,
      error: queryError,
      count: allLimits?.length || 0,
      data: allLimits,
    });

    // Try the exact match query
    const { data: exactMatch, error: exactError } = await supabase
      .from("bet_limits")
      .select("*")
      .eq("bet_date", betDate)
      .eq("game_title", gameTitle)
      .eq("number", formattedCombination);

    console.log("Exact match query:", {
      success: !exactError,
      error: exactError,
      found: exactMatch?.length > 0,
      match: exactMatch?.[0],
    });

    if (exactMatch && exactMatch.length > 0) {
      const limit = exactMatch[0];
      const isAllowed = amount <= limit.limit_amount;

      console.log("Limit check:", {
        betAmount: amount,
        limitAmount: limit.limit_amount,
        isAllowed,
      });

      return {
        allowed: isAllowed,
        limitAmount: limit.limit_amount,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in checkBetLimit:", error);
    return { allowed: true };
  }
}
