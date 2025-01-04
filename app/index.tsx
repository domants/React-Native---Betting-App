import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { View } from "react-native";
import { ThemedText } from "@/components/ThemedText";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Get user details including role
      const { data: userDetails } = await supabase
        .from("users")
        .select("role")
        .eq("email", session.user.email)
        .single();

      if (!userDetails) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <Redirect href={isAuthenticated ? "/(admin)/dashboard" : "/(auth)/login"} />
  );
}
