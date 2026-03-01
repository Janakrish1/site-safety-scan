import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InspectionHeader as HeaderType } from "@/types/inspection";
import { Building2, MapPin, HardHat, Calendar, Users } from "lucide-react";

interface Props {
  header: HeaderType;
  onChange: (h: HeaderType) => void;
}

export function InspectionHeaderForm({ header, onChange }: Props) {
  const update = (field: keyof HeaderType, value: string | string[]) =>
    onChange({ ...header, [field]: value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> Company
        </Label>
        <Input
          placeholder="Acme Construction Co."
          value={header.company_name}
          onChange={(e) => update("company_name", e.target.value)}
          className="bg-card"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Jobsite Address
        </Label>
        <Input
          placeholder="123 Main St, City, State"
          value={header.jobsite_address}
          onChange={(e) => update("jobsite_address", e.target.value)}
          className="bg-card"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <HardHat className="h-3.5 w-3.5" /> Superintendent
        </Label>
        <Input
          placeholder="John Smith"
          value={header.superintendent}
          onChange={(e) => update("superintendent", e.target.value)}
          className="bg-card"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" /> Date & Time
        </Label>
        <Input
          type="datetime-local"
          value={header.date_time}
          onChange={(e) => update("date_time", e.target.value)}
          className="bg-card"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> Inspectors (comma-separated)
        </Label>
        <Input
          placeholder="Jane Doe, Bob Wilson"
          value={header.inspectors.join(", ")}
          onChange={(e) =>
            update("inspectors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
          className="bg-card"
        />
      </div>
    </div>
  );
}
