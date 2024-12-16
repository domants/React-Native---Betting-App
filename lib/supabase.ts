import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://koclapmkkvjxfcdvywrd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvY2xhcG1ra3ZqeGZjZHZ5d3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMTg2OTUsImV4cCI6MjA0OTg5NDY5NX0.u8sQNk_nLU5E5SMOkNVMDywiwmWLHHEaEbIP3t8d8yE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
