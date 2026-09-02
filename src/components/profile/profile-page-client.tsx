"use client";

import { useState } from "react";
import { AppHeader, boardsNavItem } from "@/components/layout/app-header";
import { UserIcon } from "@/components/ui/icon";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/use-profile";

export function ProfilePageClient() {
  const { data: profile, isLoading, error } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const displayName = draftName ?? profile?.display_name ?? "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setFormError("Display name is required");
      return;
    }
    try {
      await updateProfile.mutateAsync({ display_name: trimmed });
      setDraftName(null);
      setMessage("Profile updated");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="Profile"
        backHref="/boards"
        navItem={boardsNavItem}
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 font-display text-3xl text-teal-950">
            <UserIcon size={28} color="#0f766e" />
            Your profile
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            How you appear on boards, cards, and comments
          </p>
        </div>

        {isLoading && <p className="text-slate-500">Loading profile…</p>}
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load profile"}
          </p>
        )}

        {profile && (
          <form
            onSubmit={onSubmit}
            className="space-y-6 rounded-2xl border border-teal-900/10 bg-white p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed here
              </p>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
              />
            </div>

            <div className="text-xs text-slate-400">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {message && <p className="text-sm text-teal-700">{message}</p>}

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
