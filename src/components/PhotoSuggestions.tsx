import type { ChecklistSection } from "@/types/inspection";
import { Camera, ChevronRight } from "lucide-react";

const sectionSuggestions: Record<string, string[]> = {
  "Jobsite General": ["posted safety signs", "first aid kit", "emergency phone numbers board"],
  "Housekeeping & Sanitation": ["work areas and walkways", "waste containers/dumpsters", "restroom facilities"],
  "Fire Prevention": ["fire extinguisher locations", "no smoking signs", "flammable storage areas"],
  "Hazard Communication": ["chemical labels", "SDS binder/station"],
  "Electrical": ["electrical panels", "GFCI outlets", "temporary wiring", "extension cords"],
  "Personal Protective Equipment": ["workers wearing PPE", "PPE storage area"],
  "Tools & Equipment": ["power tools in use", "tool storage"],
  "Ladders": ["ladders set up on site"],
  "Scaffolding": ["scaffolding structures", "scaffold tags"],
  "Excavation": ["excavation sites", "trench shoring"],
  "Heavy Equipment": ["heavy equipment in use", "backup alarms area"],
  "Motor Vehicles": ["vehicle parking areas", "speed limit signs"],
};

export function PhotoSuggestions({ sections }: { sections: ChecklistSection[] }) {
  const unknownSections = sections.filter(
    (s) => s.items.every((i) => i.status === "UNKNOWN")
  );

  if (unknownSections.length === 0) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-accent">
        <Camera className="h-3.5 w-3.5" />
        Suggested Photos
      </h4>
      <div className="space-y-1.5">
        {unknownSections.slice(0, 4).map((s) => (
          <div key={s.name} className="text-[11px]">
            <span className="font-medium text-foreground">{s.name}:</span>{" "}
            <span className="text-muted-foreground">
              {(sectionSuggestions[s.name] || ["relevant area"]).join(", ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
