import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const suffix = error ? `&error=${encodeURIComponent(error)}` : "";
  const nextSuffix = next?.startsWith("/") && !next.startsWith("//")
    ? `&next=${encodeURIComponent(next)}`
    : "";
  redirect(`/auth?mode=login${suffix}${nextSuffix}`);
}
