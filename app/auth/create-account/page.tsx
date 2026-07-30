import { redirect } from "next/navigation";

export default function CreateAccountPage() {
  redirect("/auth?mode=signup");
}
