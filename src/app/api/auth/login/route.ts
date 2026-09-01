import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/auth/client-ip";
import { assertAuthRateLimit } from "@/lib/auth/rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/rate-limits";
import { createClient } from "@/lib/supabase/server";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await assertAuthRateLimit({
    action: "login",
    bucketKey: `${ip}:${email}`,
    ...AUTH_RATE_LIMITS.login,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: 429 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  await supabase.rpc("ensure_profile");
  await supabase.rpc("claim_invites");

  return NextResponse.json({ ok: true });
}
