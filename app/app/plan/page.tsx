import { redirect } from "next/navigation";

export default function WeeklyPlanPage() {
  redirect("/setup?from=weekly-update");
}
