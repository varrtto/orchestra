import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/auth/client-ip";
import { assertAuthRateLimit } from "@/lib/auth/rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/rate-limits";
import { createClient } from "@/lib/supabase/server";

type SignupBody = {
  email?: string;
  password?: string;
  displayName?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SignupBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const displayName = body.displayName?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await assertAuthRateLimit({
    action: "signup",
    bucketKey: ip,
    ...AUTH_RATE_LIMITS.signup,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: 429 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.rpc("ensure_profile");
  await supabase.rpc("claim_invites");

  return NextResponse.json({ ok: true });
}
