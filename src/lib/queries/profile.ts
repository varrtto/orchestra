import { createClient } from "@/lib/supabase/client";
import { isLocale } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export const profileQueryKey = ["profile"] as const;

function normalizeProfile(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    email: data.email as string,
    display_name: (data.display_name as string | null) ?? null,
    preferred_language: isLocale(data.preferred_language)
      ? data.preferred_language
      : "en",
    created_at: data.created_at as string,
  };
}

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
  return normalizeProfile(data as Record<string, unknown>);
}

export async function updateProfile(patch: {
  display_name?: string;
  preferred_language?: Profile["preferred_language"];
}): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: {
    display_name?: string;
    preferred_language?: Profile["preferred_language"];
  } = {};
  if (patch.display_name !== undefined) {
    updates.display_name = patch.display_name.trim();
  }
  if (patch.preferred_language !== undefined) {
    updates.preferred_language = patch.preferred_language;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Failed to update profile");
  return normalizeProfile(data as Record<string, unknown>);
}
