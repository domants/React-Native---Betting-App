import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        console.log("Fetching current user session...");
        const { data: authData } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (authData.session?.user) {
          console.log(
            "Found auth session, fetching user details:",
            authData.session.user.email
          );
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", authData.session.user.email)
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
            return;
          }

          console.log("Setting user data:", {
            id: userData.id,
            email: userData.email,
            role: userData.role,
          });

          if (isMounted) {
            setUser({
              ...userData,
              username: userData.name,
              role: userData.role,
            });
          }
        } else {
          console.log("No auth session found");
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, fetching details");
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (!error && userData && isMounted) {
          console.log("Setting user data after sign in:", {
            id: userData.id,
            role: userData.role,
          });
          setUser({
            ...userData,
            username: userData.name,
            role: userData.role,
          });
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing user data");
        if (isMounted) {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
