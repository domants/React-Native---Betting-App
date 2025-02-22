import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hqwxmqqsmofpevnzycrx.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd3htcXFzbW9mcGV2bnp5Y3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODAzMDYxNSwiZXhwIjoyMDUzNjA2NjE1fQ.-rIT4jxaBPKc3j6toCRm59FEUp-mk4LsGdNgHAXunVo"; // Get this from Project Settings > API

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Add this function to create a user with admin API
export async function createAdminUser() {
  try {
    // First delete if exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = existingUser?.users.find(
      (u) => u.email === "admin@admin.com"
    );
    if (adminUser) {
      // Delete from public.users first (due to foreign key constraint)
      await supabaseAdmin.from("users").delete().eq("id", adminUser.id);
      // Then delete from auth.users
      await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
    }

    // Create new admin user with confirmed email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@admin.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: { role: "Admin" },
    });

    if (error) {
      console.error("Error creating auth user:", error);
      throw error;
    }
    console.log("Admin user created in auth.users:", data);

    // Create corresponding public.users record
    if (data.user) {
      const { error: dbError } = await supabaseAdmin.from("users").insert({
        id: data.user.id,
        email: "admin@admin.com",
        name: "Admin",
        role: "Admin",
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("Error creating public.users record:", dbError);
        // Rollback auth user creation if public.users insert fails
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        throw dbError;
      }
      console.log("Admin user created in public.users");
    }

    return data;
  } catch (error) {
    console.error("Error in createAdminUser:", error);
    throw error;
  }
}
