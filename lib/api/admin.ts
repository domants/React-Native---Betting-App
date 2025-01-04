import { supabase } from "@/lib/supabase";
import { DrawResult, Bet, BetLimit } from "@/lib/types";

// Draw Results Management
export async function addDrawResult(data: Partial<DrawResult>) {
  // Validate format
  if (data.l2_result && !/^\d{2}$/.test(data.l2_result)) {
    throw new Error("L2 result must be exactly 2 digits");
  }
  if (data.d3_result && !/^\d{3}$/.test(data.d3_result)) {
    throw new Error("3D result must be exactly 3 digits");
  }

  // Check for duplicate draw date
  const { data: existing } = await supabase
    .from("draw_results")
    .select()
    .eq("draw_date", data.draw_date)
    .single();

  if (existing) {
    throw new Error("Results already exist for this date");
  }

  const { data: result, error } = await supabase
    .from("draw_results")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Bet Management
export async function getDailyBets(date: string) {
  const { data, error } = await supabase
    .from("bets")
    .select(
      `
      *,
      user:Users(username)
    `
    )
    .eq("draw_date", date)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Bet Limits Management
export async function setBetLimit(data: Partial<BetLimit>) {
  if (data.limit_amount && data.limit_amount <= 0) {
    throw new Error("Limit amount must be positive");
  }

  // Check for existing limit
  const { data: existing } = await supabase
    .from("bet_limits")
    .select()
    .eq("number_type", data.number_type)
    .single();

  if (existing) {
    // Update existing limit
    const { data: updated, error } = await supabase
      .from("bet_limits")
      .update({ limit_amount: data.limit_amount })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  // Create new limit
  const { data: created, error } = await supabase
    .from("bet_limits")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return created;
}

// Percentage Management
export async function updateUserPercentage(
  userId: string,
  updates: {
    percentage_balance?: number;
    winnings_balance?: number;
  }
) {
  // Get parent's allocation
  const { data: user } = await supabase
    .from("Users")
    .select("parent_id")
    .eq("id", userId)
    .single();

  if (user?.parent_id) {
    // Get total allocated to siblings with default empty array
    const { data: siblings, error: siblingsError } = await supabase
      .from("Users")
      .select("percentage_balance, winnings_balance")
      .eq("parent_id", user.parent_id);

    if (siblingsError) {
      throw new Error("Failed to fetch siblings for validation");
    }

    // Now siblings will never be null
    const totalPercentage = (siblings || []).reduce(
      (sum, sibling) => sum + (sibling.percentage_balance || 0),
      0
    );

    // Validate against parent's limits
    if (
      updates.percentage_balance &&
      totalPercentage + updates.percentage_balance > 100
    ) {
      throw new Error("Total percentage allocation exceeds 100%");
    }
  }

  const { data, error } = await supabase
    .from("Users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubordinates() {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      name,
      role,
      percentage_l2,
      percentage_l3,
      winnings_l2,
      winnings_l3
    `
    )
    .in("role", ["Coordinator", "Sub-Coordinator", "Usher"])
    .order("role", { ascending: true });

  if (error) {
    console.error("Error fetching subordinates:", error);
    throw error;
  }

  console.log("Fetched subordinates:", data);
  return data;
}

export async function updateUserAllocation(
  userId: string,
  updates: {
    percentage_l2?: number;
    percentage_l3?: number;
    winnings_l2?: number;
    winnings_l3?: number;
  }
) {
  try {
    // First check if current user is authenticated
    const { data: currentUser, error: userError } =
      await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error("Not authenticated");
    }

    console.log("Auth user ID:", currentUser.user.id);
    console.log("Auth user email:", currentUser.user.email);

    // Get current user's role for debugging - using maybeSingle() instead of single()
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", currentUser.user.email)
      .maybeSingle();

    if (roleError) {
      console.error("Role fetch error:", roleError);
      throw new Error("Failed to fetch user role");
    }

    if (!userData) {
      console.error("User not found in database");
      throw new Error("User profile not found in database");
    }

    console.log("Found user data:", userData);

    // Check if user is admin using direct role check - using uppercase 'Admin'
    if (userData.role !== "Admin") {
      console.error("User is not admin. Current role:", userData.role);
      throw new Error("Only admins can update user allocations");
    }

    // Verify target user exists and get current values
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, role, percentage_l2, percentage_l3")
      .eq("id", userId)
      .single();

    if (targetError) {
      console.error("Target user check error:", targetError);
      throw new Error(`Failed to find target user: ${targetError.message}`);
    }

    if (!targetUser) {
      throw new Error(`Target user not found with ID: ${userId}`);
    }

    console.log("Target user found:", targetUser);
    console.log("Applying updates:", updates);

    // Proceed with the update
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update user allocation");
    }

    console.log("Update successful:", updated);
    return updated;
  } catch (error) {
    console.error("Update allocation error:", error);
    throw error;
  }
}
