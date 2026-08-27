import { redirect } from "next/navigation";

/** Kept so older Chirp links and bookmarks still work. The screen itself is a
 *  view on /app; rendering it from its own route re-mounted the dashboard and
 *  refetched everything, which showed as a content-then-skeleton flash. */
export default async function LegacyWhatHappenedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "view") continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (first) query.set(key, first);
  }

  query.set("view", "what-happened");
  redirect(`/app?${query.toString()}`);
}
