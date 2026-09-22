import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell taglineKey="auth.loginTagline">
      <LoginForm />
    </AuthPageShell>
  );
}
