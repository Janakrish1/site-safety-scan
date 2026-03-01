import type { ItemStatus } from "@/types/inspection";
import { cn } from "@/lib/utils";

const statusConfig: Record<ItemStatus, { label: string; className: string }> = {
  YES: { label: "YES", className: "bg-safety-green text-safety-green-foreground" },
  NO: { label: "NO", className: "bg-safety-red text-safety-red-foreground" },
  NA: { label: "N/A", className: "bg-muted text-muted-foreground" },
  UNKNOWN: { label: "???", className: "bg-safety-unknown text-safety-unknown-foreground animate-pulse-glow" },
};

export function StatusPill({ status, onClick }: { status: ItemStatus; onClick?: () => void }) {
  const config = statusConfig[status];
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-bold font-mono tracking-wider min-w-[52px] transition-all hover:scale-105",
        config.className
      )}
    >
      {config.label}
    </button>
  );
}
