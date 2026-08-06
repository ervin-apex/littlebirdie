import Link from "next/link";
import { unsubscribeFromChirps } from "./actions";
import "./unsubscribe.css";

export default async function ChirpUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;
  const done = status === "done" || status === "expired";
  const invalid = status === "invalid" || (!token && !done);
  return (
    <main className="chirp-unsubscribe-page">
      <section className="chirp-unsubscribe-card">
        <span className="chirp-unsubscribe-bird" aria-hidden>🐤</span>
        <p className="chirp-unsubscribe-eyebrow">Daily Chirps</p>
        <h1>{done ? "Chirps are off." : invalid ? "That link is not valid." : "Pause this venue’s Chirps?"}</h1>
        <p>
          {done
            ? "Birdee will stop emailing daily updates for this venue. Other venue preferences stay unchanged."
            : invalid
              ? "Open Account & venues while signed in to manage your email preferences."
              : "This only turns off the daily email for the venue named in the message. Your numbers stay exactly where they are."}
        </p>
        {!done && !invalid && token ? (
          <form action={unsubscribeFromChirps}>
            <input type="hidden" name="token" value={token} />
            <button type="submit">Turn off this venue’s Chirps</button>
          </form>
        ) : null}
        <Link href={done ? "/account" : "/auth?mode=login"}>
          {done ? "Manage all Chirps" : "Open Little Birdee"}
        </Link>
      </section>
    </main>
  );
}
