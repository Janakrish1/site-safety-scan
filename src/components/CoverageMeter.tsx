import type { ChecklistSection } from "@/types/inspection";

export function CoverageMeter({ sections }: { sections: ChecklistSection[] }) {
  const totalItems = sections.reduce((a, s) => a + s.items.length, 0);
  const assessed = sections.reduce(
    (a, s) => a + s.items.filter((i) => i.status !== "UNKNOWN").length,
    0
  );
  const pct = totalItems > 0 ? Math.round((assessed / totalItems) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Coverage</span>
        <span className="font-mono font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {assessed} of {totalItems} items assessed
      </p>
    </div>
  );
}
