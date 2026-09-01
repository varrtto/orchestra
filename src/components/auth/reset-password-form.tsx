"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnterIcon } from "@/components/ui/icon";
import { useResetPasswordMutation } from "@/hooks/use-auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const resetPassword = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword.mutateAsync({ password });
      router.push("/boards");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={resetPassword.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        <EnterIcon size={18} color="currentColor" />
        {resetPassword.isPending ? "Updating…" : "Update password"}
      </button>
      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
