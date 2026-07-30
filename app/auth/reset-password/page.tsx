import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Fresh key, same numbers."
      description="Choose a new password for your Little Birdee account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
