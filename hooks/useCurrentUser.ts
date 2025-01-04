import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (authData.session?.user) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", authData.session.user.email)
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
            return;
          }

          setUser({
            ...userData,
            username: userData.name,
            role: userData.role,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (!error && userData) {
          setUser({
            ...userData,
            username: userData.name,
            role: userData.role,
          });
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
