"use client";

import { useRouter } from "next/navigation";
import { ExitIcon } from "@/components/ui/icon";
import { useSignOutMutation } from "@/hooks/use-auth";

export function SignOutButton({
  className,
  onSignedOut,
}: {
  className?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const signOut = useSignOutMutation();

  async function handleSignOut() {
    await signOut.mutateAsync();
    onSignedOut?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={signOut.isPending}
      className={
        className ??
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
      }
    >
      <ExitIcon size={18} />
      {signOut.isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
