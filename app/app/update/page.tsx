import { redirect } from "next/navigation";

export default async function LegacyDailyUpdatePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const params = await searchParams;
  const date = Array.isArray(params.date) ? params.date[0] : params.date;
  redirect(
    date
      ? `/app/check-in?date=${encodeURIComponent(date)}`
      : "/app/check-in",
  );
}
