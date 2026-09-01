import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Image from "next/image";

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#99f6e4_0%,_transparent_55%),linear-gradient(160deg,#f4f7f6_0%,#d1fae5_100%)]"
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-teal-900/10 bg-white/80 p-8 shadow-xl shadow-teal-900/5 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <Image src="/icon.png" alt="Orchest" width={100} height={100} />
          <p className="mt-4 text-sm text-slate-600">Choose a new password</p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
