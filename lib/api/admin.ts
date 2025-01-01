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
    .from("Users")
    .select(
      `
      id,
      username,
      user_role,
      percentage_l2,
      percentage_l3,
      winnings_l2,
      winnings_l3
    `
    )
    .in("user_role", ["coordinator", "sub_coordinator", "usher"])
    .order("user_role", { ascending: true });

  if (error) throw error;
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
    // First check if current user is admin
    const { data: currentUser, error: userError } =
      await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error("Not authenticated");
    }

    console.log("Current user:", currentUser.user.id);

    // First verify if the user exists before checking role
    const { data: userExists, error: existsError } = await supabase
      .from("Users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existsError) {
      console.error("User existence check error:", existsError);
      throw new Error(
        `Failed to verify user existence: ${existsError.message}`
      );
    }

    if (!userExists) {
      console.error("Target user does not exist:", userId);
      throw new Error(`User with ID ${userId} does not exist`);
    }

    // Get current user's role
    const { data: userData, error: roleError } = await supabase
      .from("Users")
      .select("user_role")
      .eq("id", currentUser.user.id)
      .single();

    if (roleError) {
      console.error("Role check error:", roleError);
      throw new Error(`Failed to verify user role: ${roleError.message}`);
    }

    if (!userData) {
      throw new Error("User profile not found");
    }

    console.log("User role:", userData.user_role);

    if (userData.user_role !== "admin") {
      throw new Error("Only admins can update user allocations");
    }

    // Verify target user exists and get current values
    const { data: targetUser, error: targetError } = await supabase
      .from("Users")
      .select("id, user_role, percentage_l2, percentage_l3")
      .eq("id", userId)
      .single();

    if (targetError) {
      console.error("Target user check error:", targetError);
      throw new Error(`Failed to find target user: ${targetError.message}`);
    }

    if (!targetUser) {
      throw new Error(`Target user not found with ID: ${userId}`);
    }

    console.log("Target user current values:", targetUser);

    // Get all users to validate total percentages
    const { data: allUsers, error: usersError } = await supabase
      .from("Users")
      .select("id, percentage_l2, percentage_l3")
      .neq("id", userId);

    if (usersError) {
      console.error("Users fetch error:", usersError);
      throw new Error("Failed to fetch users for validation");
    }

    const totalL2 = (allUsers || []).reduce(
      (sum, user) => sum + (user.percentage_l2 || 0),
      0
    );
    const totalL3 = (allUsers || []).reduce(
      (sum, user) => sum + (user.percentage_l3 || 0),
      0
    );

    console.log("Current totals - L2:", totalL2, "L3:", totalL3);
    console.log(
      "Attempting to add - L2:",
      updates.percentage_l2,
      "L3:",
      updates.percentage_l3
    );

    // Validate percentages
    if (updates.percentage_l2 && totalL2 + updates.percentage_l2 > 100) {
      throw new Error(
        `Total L2 percentage allocation would exceed 100% (current: ${totalL2}, adding: ${updates.percentage_l2})`
      );
    }
    if (updates.percentage_l3 && totalL3 + updates.percentage_l3 > 100) {
      throw new Error(
        `Total 3D percentage allocation would exceed 100% (current: ${totalL3}, adding: ${updates.percentage_l3})`
      );
    }

    // Prepare update data - keep existing values if not provided
    const updateData = {
      percentage_l2: updates.percentage_l2 ?? targetUser.percentage_l2 ?? 0,
      percentage_l3: updates.percentage_l3 ?? targetUser.percentage_l3 ?? 0,
      winnings_l2: updates.winnings_l2 ?? 0,
      winnings_l3: updates.winnings_l3 ?? 0,
    };

    console.log("Updating user with data:", updateData);
    console.log("Update query parameters - userId:", userId);

    // Update the user allocation with more detailed error handling
    const { data, error } = await supabase
      .from("Users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update error details:", error);
      console.error("Update query failed for user:", userId);
      console.error("Update data:", updateData);
      throw new Error(`Failed to update allocation: ${error.message}`);
    }

    if (!data) {
      console.error("No data returned after update for user:", userId);
      throw new Error("Failed to update allocation: No data returned");
    }

    console.log("Update successful. Updated user data:", data);
    return data;
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}
