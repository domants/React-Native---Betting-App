import { supabase } from "@/lib/supabase";
import { User, CreateUserDTO } from "@/lib/types";

export async function createUser(data: CreateUserDTO) {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) throw authError;

  // Then create user profile
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert([
      {
        id: authData.user?.id,
        username: data.username,
        email: data.email,
        role: data.role,
        parent_id: data.parent_id,
        percentage_balance: data.percentage_balance || 0,
        winnings_balance: data.winnings_balance || 0,
      },
    ])
    .select()
    .single();

  if (userError) throw userError;
  return userData;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUsersByParentId(parentId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
