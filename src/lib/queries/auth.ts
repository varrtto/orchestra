import { createClient } from "@/lib/supabase/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResult = {
  message: string;
};

export type ResetPasswordInput = {
  password: string;
};

async function parseJsonError(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json()) as { error?: string };
  return payload.error ?? fallback;
}

export async function login({ email, password }: LoginInput): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "Unable to sign in"));
  }
}

export async function signUp({
  email,
  password,
  displayName,
}: SignupInput): Promise<void> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "Unable to create account"));
  }
}

export async function forgotPassword({
  email,
}: ForgotPasswordInput): Promise<ForgotPasswordResult> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const payload = (await response.json()) as {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to send reset email");
  }

  return {
    message:
      payload.message ??
      "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPassword({ password }: ResetPasswordInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
