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
