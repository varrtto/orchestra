import { NextRequest } from "next/server";
import { completeAuthExchange } from "@/lib/supabase/auth-exchange";

export async function GET(request: NextRequest) {
  const next = new URL(request.url).searchParams.get("next");
  return completeAuthExchange(request, next ?? "/auth/reset-password");
}
