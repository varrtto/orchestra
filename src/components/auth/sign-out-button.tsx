"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExitIcon } from "@/components/ui/icon";

export function SignOutButton({
  className,
  onSignedOut,
}: {
  className?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignedOut?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={
        className ??
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      }
    >
      <ExitIcon size={18} />
      Sign out
    </button>
  );
}
