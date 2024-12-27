import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: userData } = await supabase
            .from("Users")
            .select("*")
            .eq("id", data.user.id)
            .single();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, isLoading };
}
