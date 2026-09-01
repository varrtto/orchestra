import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/auth/client-ip";
import { assertAuthRateLimit } from "@/lib/auth/rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/rate-limits";
import { createClient } from "@/lib/supabase/server";

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ForgotPasswordBody;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rateLimit = await assertAuthRateLimit({
    action: "password_recovery",
    bucketKey: `${ip}:${email}`,
    ...AUTH_RATE_LIMITS.passwordRecovery,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: 429 });
  }

  const origin = new URL(request.url).origin;
  const next = encodeURIComponent("/auth/reset-password");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${next}`,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
}
