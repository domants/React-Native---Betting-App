import { supabase } from "../supabase";
import type { User } from "@/types";

export function getAvailableRoles(
  currentUserRole: User["role"]
): User["role"][] {
  switch (currentUserRole) {
    case "Admin":
      // Admin can create any role
      return ["Admin", "Coordinator", "Sub-Coordinator", "Usher"];
    case "Coordinator":
      // Coordinator can create Sub-Coordinators and Ushers
      return ["Sub-Coordinator", "Usher"];
    case "Sub-Coordinator":
      // Sub-Coordinator can only create Ushers
      return ["Usher"];
    default:
      // Ushers can't create any roles
      return [];
  }
}

export async function createUser(userData: {
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  parent_id?: string;
}) {
  try {
    // First, check if the user has permission to create this role
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error("Not authenticated");

    const { data: userRole } = await supabase
      .from("users")
      .select("role")
      .eq("email", currentUser.user.email)
      .single();

    if (!userRole) throw new Error("User role not found");

    const availableRoles = getAvailableRoles(userRole.role);
    if (!availableRoles.includes(userData.role)) {
      throw new Error("You don't have permission to create this role");
    }

    // Create the user with service role client
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error("Error details:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getSubordinates() {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error("No authenticated user");

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("email", currentUser.user.email)
      .single();

    if (userError) throw userError;

    // Get subordinates based on role
    const { data: subordinates, error } = await supabase
      .from("users")
      .select("*")
      .neq("id", currentUser.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return subordinates;
  } catch (error) {
    console.error("Error getting subordinates:", error);
    throw error;
  }
}
