import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell taglineKey="auth.resetTagline">
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
