import { useState } from "react";
import type { ChecklistSection, ChecklistItem, ItemStatus, ImageAsset } from "@/types/inspection";
import { StatusPill } from "./StatusPill";
import { ConfidenceBar } from "./ConfidenceBar";
import { ChevronDown, ChevronRight, AlertTriangle, Eye, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  sections: ChecklistSection[];
  images: ImageAsset[];
  onUpdateItem: (sectionName: string, itemId: string, updates: Partial<ChecklistItem>) => void;
  filter: "all" | "review";
}

const statusCycle: ItemStatus[] = ["YES", "NO", "NA", "UNKNOWN"];

export function ChecklistView({ sections, images, onUpdateItem, filter }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.name, true]))
  );
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  const toggleSection = (name: string) =>
    setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const cycleStatus = (section: string, item: ChecklistItem) => {
    const idx = statusCycle.indexOf(item.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    onUpdateItem(section, item.id, { status: next, last_updated_by: "USER", confidence: 1 });
  };

  const filteredSections = sections.map((s) => ({
    ...s,
    items: filter === "review"
      ? s.items.filter((i) => i.status === "UNKNOWN" || i.confidence < 0.5)
      : s.items,
  })).filter((s) => s.items.length > 0);

  const getSectionStats = (section: ChecklistSection) => {
    const total = section.items.length;
    const yes = section.items.filter((i) => i.status === "YES").length;
    const no = section.items.filter((i) => i.status === "NO").length;
    const unknown = section.items.filter((i) => i.status === "UNKNOWN").length;
    return { total, yes, no, unknown };
  };

  return (
    <div className="space-y-2">
      {filteredSections.map((section) => {
        const stats = getSectionStats(section);
        const isOpen = expanded[section.name] ?? true;

        return (
          <div key={section.name} className="rounded-lg border bg-card overflow-hidden animate-fade-in-up">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.name)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-semibold text-sm flex-1 text-left">{section.name}</span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                {stats.yes > 0 && (
                  <span className="text-safety-green">{stats.yes} ✓</span>
                )}
                {stats.no > 0 && (
                  <span className="text-safety-red">{stats.no} ✗</span>
                )}
                {stats.unknown > 0 && (
                  <span className="text-safety-unknown">{stats.unknown} ?</span>
                )}
                <span className="text-muted-foreground">/ {stats.total}</span>
              </div>
            </button>

            {/* Items */}
            {isOpen && (
              <div className="divide-y divide-border/50">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "px-4 py-2.5 flex items-start gap-3 text-sm transition-colors",
                      item.status === "UNKNOWN" && item.confidence === 0 && "bg-muted/30"
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-xs pt-0.5 w-5 shrink-0">
                      {item.item_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground leading-snug">{item.question_text}</p>
                      {item.evidence.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Eye className="h-3 w-3 text-accent" />
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.evidence.map((e) => {
                              const img = images.find((i) => i.id === e.image_id);
                              return img?.filename || e.image_id;
                            }).join(", ")}
                          </span>
                        </div>
                      )}
                      {item.evidence.length > 0 && item.evidence[0].snippet_text && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                          "{item.evidence[0].snippet_text}"
                        </p>
                      )}
                      {editingNotes === item.id ? (
                        <input
                          autoFocus
                          className="mt-1 w-full text-xs bg-muted px-2 py-1 rounded border-none outline-none focus:ring-1 focus:ring-accent"
                          value={item.notes}
                          onChange={(e) =>
                            onUpdateItem(section.name, item.id, { notes: e.target.value })
                          }
                          onBlur={() => setEditingNotes(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingNotes(null)}
                          placeholder="Add notes…"
                        />
                      ) : item.notes ? (
                        <p
                          className="text-[11px] text-muted-foreground mt-0.5 cursor-pointer hover:text-foreground"
                          onClick={() => setEditingNotes(item.id)}
                        >
                          📝 {item.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingNotes(item.id)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <ConfidenceBar value={item.confidence} />
                      <StatusPill
                        status={item.status}
                        onClick={() => cycleStatus(section.name, item)}
                      />
                      {item.last_updated_by === "USER" && (
                        <span className="text-[9px] text-accent font-mono">USR</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
