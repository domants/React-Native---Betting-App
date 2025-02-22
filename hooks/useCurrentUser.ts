import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import { useRouter } from "expo-router";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Single function to update user data
    const updateUserData = async (session: any) => {
      try {
        if (!session?.user?.email || !isMounted) {
          setUser(null);
          router.replace("/(auth)/login");
          return;
        }

        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (!error && userData && isMounted) {
          setUser({
            ...userData,
            username: userData.name,
            role: userData.role,
          });
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Error updating user data:", error);
        router.replace("/(auth)/login");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserData(session);
    });

    // Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        await updateUserData(session);
      } else if (event === "SIGNED_OUT" && isMounted) {
        setUser(null);
        setIsLoading(false);
        router.replace("/(auth)/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
