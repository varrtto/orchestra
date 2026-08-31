import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export const profileQueryKey = ["profile"] as const;

export async function fetchProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.rpc("ensure_profile");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) throw error ?? new Error("Profile not found");
  return data as Profile;
}

export async function updateProfile(patch: {
  display_name: string;
}): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: patch.display_name.trim() })
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Failed to update profile");
  return data as Profile;
}
