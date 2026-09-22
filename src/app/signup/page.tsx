import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthPageShell taglineKey="auth.signupTagline">
      <SignupForm />
    </AuthPageShell>
  );
}
