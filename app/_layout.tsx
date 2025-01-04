import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { styled } from "nativewind";
import type { User } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const StyledView = styled(View);

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      console.log("Current segments:", segments);

      if (event === "SIGNED_OUT" || !session) {
        console.log("No session, redirecting to login");
        router.replace("/login" as const);
        return;
      }

      try {
        // Get user details including role
        const { data: userDetails, error } = await supabase
          .from("users")
          .select("role")
          .eq("email", session.user.email)
          .single();

        if (error || !userDetails) {
          console.log("Error getting user details:", error);
          await supabase.auth.signOut();
          router.replace("/login" as const);
          return;
        }

        console.log("User role:", userDetails.role);
        console.log("Current segment:", segments[0]);

        // Define dashboard paths for each role
        const dashboardPaths: Record<User["role"], string> = {
          Admin: "/(admin)/dashboard",
          Coordinator: "/(coordinator)/dashboard",
          "Sub-Coordinator": "/(sub-coordinator)/dashboard",
          Usher: "/(usher)/dashboard",
        };

        // Only redirect if we're in the auth route or at the root
        const currentSegment = segments[0];
        if (currentSegment === "(auth)" || !currentSegment) {
          const path = dashboardPaths[userDetails.role as User["role"]];
          if (path) {
            console.log("Routing to dashboard:", path);
            router.replace(path as any);
          } else {
            console.log("Unknown role:", userDetails.role);
            router.replace("/login" as const);
          }
        }
      } catch (error) {
        console.error("Error in auth routing:", error);
        router.replace("/login" as const);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StyledView className="flex-1">
          <Slot />
        </StyledView>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
