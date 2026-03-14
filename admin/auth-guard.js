import { supabase } from "./supabaseClient.js";

export const ADMIN_EMAIL = "admin@exclusivemuseum.com";

export async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    location.href = "login.html";
    throw new Error("Admin session required");
  }

  if (data.user.email !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    location.href = "login.html";
    throw new Error("Unauthorized admin user");
  }

  return data.user;
}
