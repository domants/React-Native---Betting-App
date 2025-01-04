import { supabase } from "../supabase";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import type { User } from "@/types";

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

// Function to hash password the same way as stored in database
async function hashPassword(password: string): Promise<string> {
  const data = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return data;
}

export async function signIn({ emailOrUsername, password }: LoginCredentials) {
  try {
    console.log("Attempting to find user with:", emailOrUsername);

    // Use a simple exact match query
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, password_hash, role")
      .or(`email.eq.${emailOrUsername},name.eq.${emailOrUsername}`)
      .limit(1)
      .maybeSingle();

    if (userError) {
      console.log("Database error:", userError.message);
      throw new Error("Database error");
    }

    if (!user) {
      console.log("No user found with provided credentials");
      throw new Error("Invalid credentials");
    }

    console.log("User found:", { name: user.name, email: user.email });

    // Hash the provided password
    const hashedPassword = await hashPassword(password);
    console.log("Comparing password hashes...");

    // Direct comparison of the hashes
    if (user.password_hash !== hashedPassword) {
      console.log("Password hashes don't match");
      throw new Error("Invalid credentials");
    }

    console.log("Password verified, creating Supabase Auth session");

    // Create a session in Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (error) {
      console.log("Supabase Auth error:", error.message);
      // If Supabase Auth fails, create a new auth user
      console.log("Attempting to create new auth user");
      const { data: newAuthUser, error: signUpError } =
        await supabase.auth.signUp({
          email: user.email,
          password: password,
        });

      if (signUpError) {
        console.log("Failed to create auth user:", signUpError.message);
        throw signUpError;
      }

      console.log("New auth user created");
      return { user: newAuthUser.user, userDetails: user };
    }

    console.log("Login successful");
    console.log("User role:", user.role);

    // Route based on user role
    const dashboardPaths: Record<User["role"], string> = {
      Admin: "/(admin)/dashboard",
      Coordinator: "/(coordinator)/dashboard",
      "Sub-Coordinator": "/(sub-coordinator)/dashboard",
      Usher: "/(usher)/dashboard",
    };

    const path = dashboardPaths[user.role as User["role"]];
    if (!path) {
      console.error("Unknown user role:", user.role);
      throw new Error("Invalid user role");
    }

    console.log("Navigating to:", path);
    router.replace(path as any);
    return { user: data.user, userDetails: user };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.replace("/login" as const);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Get session error:", error);
    throw error;
  }
}
