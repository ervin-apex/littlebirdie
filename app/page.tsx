import { redirect } from "next/navigation";

/**
 * Keep one public entry into the approved product flow. The home route owns
 * first-time setup and forwards returning operators to the live dashboard.
 */
export default function RootPage() {
  redirect("/home");
}
