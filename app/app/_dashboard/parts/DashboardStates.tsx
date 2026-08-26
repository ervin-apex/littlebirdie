import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";

export function DashboardSkeleton() {
  return <div className="scoreboard-skeleton" aria-label="Loading dashboard"><div /><div /><div /></div>;
}

export function DashboardLoadError({ message }: { message: string }) {
  return (
    <section className="scoreboard-load-error" role="alert">
      <BirdeeMascot state="loss" size={120} />
      <div>
        <h1>Birdee couldn&apos;t open this venue.</h1>
        <p>{message}</p>
        <ProductButton href="/account" variant="primary">
          Check my venue
        </ProductButton>
      </div>
    </section>
  );
}
