import { ArrowLeft } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";

export function ViewBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ProductButton
      variant="tertiary"
      size="compact"
      className="view-back"
      onClick={onClick}
      leadingIcon={<ArrowLeft weight="bold" />}
    >
      {label}
    </ProductButton>
  );
}
