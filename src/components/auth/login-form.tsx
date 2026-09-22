"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnterIcon } from "@/components/ui/icon";
import { useT } from "@/components/providers/locale-provider";
import { useLoginMutation } from "@/hooks/use-auth";

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const login = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("message") === "password_updated") {
      setMessage(t("auth.passwordUpdated"));
    }
    if (params.get("error") === "auth_callback") {
      setError(t("auth.authCallbackError"));
    }
  }, [t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await login.mutateAsync({ email, password });
      router.push("/boards");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unableSignIn"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("common.email")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("common.password")}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-teal-700 dark:text-teal-300 hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
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
      {message && <p className="text-sm text-teal-800 dark:text-teal-300">{message}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={login.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        <EnterIcon size={18} color="currentColor" />
        {login.isPending ? t("auth.signingIn") : t("auth.signIn")}
      </button>
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
          {t("auth.signUp")}
        </Link>
      </p>
    </form>
  );
}
