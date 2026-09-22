"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EnterIcon } from "@/components/ui/icon";
import { useT } from "@/components/providers/locale-provider";
import { useResetPasswordMutation } from "@/hooks/use-auth";

export function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const resetPassword = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        nextSession
      ) {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sessionReady) {
      setError(t("auth.resetLinkExpired"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    try {
      await resetPassword.mutateAsync({ password });
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login?message=password_updated");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("auth.unableUpdatePassword"),
      );
    }
  }

  if (checkingSession) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{t("auth.verifyingLink")}</p>;
  }

  if (!sessionReady) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p className="text-sm text-red-600 dark:text-red-400">{t("auth.resetLinkInvalid")}</p>
        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline"
        >
          {t("auth.requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("auth.newPassword")}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {t("auth.confirmPassword")}
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={resetPassword.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        <EnterIcon size={18} color="currentColor" />
        {resetPassword.isPending ? t("auth.updating") : t("auth.updatePassword")}
      </button>
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        <Link href="/login" className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
