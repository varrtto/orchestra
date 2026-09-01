"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeIcon } from "@/components/ui/icon";
import { useForgotPasswordMutation } from "@/hooks/use-auth";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const result = await forgotPassword.mutateAsync({ email });
      setMessage(result.message);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-teal-600 focus:ring-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-800">{message}</p>}
      <button
        type="submit"
        disabled={forgotPassword.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        <EnvelopeIcon size={18} color="currentColor" />
        {forgotPassword.isPending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
