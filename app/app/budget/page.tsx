import { redirect } from "next/navigation";

export default function WeeklyBudgetPage() {
  redirect("/setup?from=weekly-update");
}
