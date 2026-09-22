"use client";

import { useEffect, useState } from "react";
import { AppHeader, boardsNavItem } from "@/components/layout/app-header";
import { UserIcon } from "@/components/ui/icon";
import { useLocale } from "@/components/providers/locale-provider";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/use-profile";
import { LOCALES, type Locale } from "@/lib/i18n";

export function ProfilePageClient() {
  const { t, locale, setLocale } = useLocale();
  const { data: profile, isLoading, error } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftLocale, setDraftLocale] = useState<Locale | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const displayName = draftName ?? profile?.display_name ?? "";
  const selectedLocale =
    draftLocale ?? profile?.preferred_language ?? locale;

  useEffect(() => {
    if (!profile?.preferred_language) return;
    setLocale(profile.preferred_language);
  }, [profile?.preferred_language, setLocale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setFormError(t("profile.displayNameRequired"));
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({
        display_name: trimmed,
        preferred_language: selectedLocale,
      });
      setDraftName(null);
      setDraftLocale(null);
      setLocale(updated.preferred_language);
      setMessage(t("profile.updated"));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("profile.updateFailed"),
      );
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title={t("profile.title")}
        backHref="/boards"
        navItem={boardsNavItem}
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 font-display text-3xl text-teal-950 dark:text-teal-50">
            <UserIcon size={28} color="#0f766e" />
            {t("profile.heading")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("profile.subtitle")}</p>
        </div>

        {isLoading && (
          <p className="text-slate-500 dark:text-slate-400">{t("profile.loading")}</p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : t("profile.loadFailed")}
          </p>
        )}

        {profile && (
          <form
            onSubmit={onSubmit}
            className="space-y-6 rounded-2xl border border-teal-900/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t("common.email")}
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-slate-500 dark:text-slate-400"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t("profile.emailHint")}
              </p>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t("profile.displayName")}
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none ring-teal-600 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="language"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t("profile.language")}
              </label>
              <select
                id="language"
                value={selectedLocale}
                onChange={(e) => {
                  const next = e.target.value as Locale;
                  setDraftLocale(next);
                  setLocale(next);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none ring-teal-600 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              >
                {LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {code === "es" ? t("languages.es") : t("languages.en")}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t("profile.languageHint")}
              </p>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500">
              {t("profile.memberSince")}{" "}
              {new Date(profile.created_at).toLocaleDateString(
                selectedLocale === "es" ? "es" : "en",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </div>

            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
            {message && <p className="text-sm text-teal-700 dark:text-teal-300">{message}</p>}

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {updateProfile.isPending
                ? t("common.saving")
                : t("profile.saveChanges")}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
