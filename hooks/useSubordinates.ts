import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./useCurrentUser";

export function useSubordinates() {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ["subordinates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const query = supabase.from("users").select("id");

      if (user.role === "Coordinator") {
        query.eq("parent_id", user.id);
      } else if (user.role === "Sub-Coordinator") {
        query.eq("parent_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return [user.id, ...data.map((u) => u.id)];
    },
    enabled:
      !!user?.id && ["Coordinator", "Sub-Coordinator"].includes(user.role),
  });
}
