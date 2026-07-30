import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const suffix = error ? `&error=${encodeURIComponent(error)}` : "";
  redirect(`/auth?mode=login${suffix}`);
}
