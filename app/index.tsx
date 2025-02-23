import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { View } from "react-native";
import { ThemedText } from "@/components/ThemedText";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

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
        .eq("id", session.user.id)
        .single();

      if (!userDetails) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        setUserRole(userDetails.role);
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

  // Route based on authentication and role
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route to appropriate dashboard based on role
  switch (userRole?.toLowerCase()) {
    case "admin":
      return <Redirect href="/(admin)/dashboard" />;
    case "coordinator":
    case "sub-coordinator":
    case "usher":
      return <Redirect href="/(tabs)/dashboard" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
