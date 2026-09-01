import { createAdminClient } from "@/lib/supabase/admin";

type AuthRateLimitConfig = {
  action: string;
  bucketKey: string;
  maxCount: number;
  windowSeconds: number;
};

export async function assertAuthRateLimit(
  config: AuthRateLimitConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: true };
  }

  const { error } = await admin.rpc("assert_auth_rate_limit", {
    p_action: config.action,
    p_bucket_key: config.bucketKey,
    p_max_count: config.maxCount,
    p_window_seconds: config.windowSeconds,
  });

  if (!error) return { ok: true };

  if (error.message.includes("Too many attempts")) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Unable to process request. Please try again." };
}
