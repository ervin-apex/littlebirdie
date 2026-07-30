import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="We’ll get you back in."
      description="Resetting your password will not change any business or venue records."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
