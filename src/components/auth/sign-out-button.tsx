"use client";

import { useRouter } from "next/navigation";
import { ExitIcon } from "@/components/ui/icon";
import { useT } from "@/components/providers/locale-provider";
import { useSignOutMutation } from "@/hooks/use-auth";

export function SignOutButton({
  className,
  onSignedOut,
}: {
  className?: string;
  onSignedOut?: () => void;
}) {
  const t = useT();
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
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-60"
      }
    >
      <ExitIcon size={18} />
      {signOut.isPending ? t("nav.signingOut") : t("nav.signOut")}
    </button>
  );
}
