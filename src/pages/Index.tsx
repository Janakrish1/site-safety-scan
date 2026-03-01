import { useState, useCallback } from "react";
import type { Inspection, ChecklistItem, ChecklistSection, ImageAsset, InspectionHeader } from "@/types/inspection";
import { createChecklistSchema } from "@/data/checklist-schema";
import { InspectionHeaderForm } from "@/components/InspectionHeader";
import { ImageGallery } from "@/components/ImageGallery";
import { ChecklistView } from "@/components/ChecklistView";
import { AnalysisButton } from "@/components/AnalysisButton";
import { CoverageMeter } from "@/components/CoverageMeter";
import { PhotoSuggestions } from "@/components/PhotoSuggestions";
import { Shield, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const createEmptyInspection = (): Inspection => ({
  id: crypto.randomUUID(),
  header: {
    company_name: "",
    jobsite_address: "",
    superintendent: "",
    date_time: new Date().toISOString().slice(0, 16),
    inspectors: [],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [],
  checklist: createChecklistSchema(),
});

const Index = () => {
  const [inspection, setInspection] = useState<Inspection>(createEmptyInspection);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<"all" | "review">("all");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const updateHeader = useCallback((header: InspectionHeader) => {
    setInspection((p) => ({ ...p, header, updated_at: new Date().toISOString() }));
  }, []);

  const addImages = useCallback(async (files: File[]) => {
    setIsUploading(true);
    const newImages: ImageAsset[] = await Promise.all(
      files.map(async (f) => {
        const url = URL.createObjectURL(f);
        return {
          id: crypto.randomUUID(),
          filename: f.name,
          url,
          uploaded_at: new Date().toISOString(),
          _file: f, // keep reference for analysis
        } as ImageAsset & { _file: File };
      })
    );
    setInspection((p) => ({
      ...p,
      images: [...p.images, ...newImages],
      updated_at: new Date().toISOString(),
    }));
    setIsUploading(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    setInspection((p) => ({
      ...p,
      images: p.images.filter((i) => i.id !== id),
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const updateChecklistItem = useCallback(
    (sectionName: string, itemId: string, updates: Partial<ChecklistItem>) => {
      setInspection((p) => ({
        ...p,
        checklist: p.checklist.map((s) =>
          s.name === sectionName
            ? {
                ...s,
                items: s.items.map((i) =>
                  i.id === itemId ? { ...i, ...updates } : i
                ),
              }
            : s
        ),
        updated_at: new Date().toISOString(),
      }));
    },
    []
  );

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const runAnalysis = useCallback(async () => {
    if (inspection.images.length === 0) return;
    setIsAnalyzing(true);

    try {
      // Convert images to data URLs for vision model
      const imageData = await Promise.all(
        inspection.images.map(async (img) => {
          // Fetch blob from object URL and convert to data URL
          const response = await fetch(img.url);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return { id: img.id, filename: img.filename, data_url: dataUrl };
        })
      );

      // Build simplified schema for the AI
      const schemaForAI = inspection.checklist.map((s) => ({
        section: s.name,
        items: s.items.map((i) => ({ id: i.id, number: i.item_number, question: i.question_text })),
      }));

      const { data, error } = await supabase.functions.invoke("analyze-site", {
        body: { images: imageData, checklist_schema: schemaForAI },
      });

      if (error) throw error;

      const findings = data?.findings || [];

      // Apply findings to checklist
      setInspection((prev) => {
        const updated = { ...prev, updated_at: new Date().toISOString() };
        updated.checklist = prev.checklist.map((section) => ({
          ...section,
          items: section.items.map((item) => {
            const finding = findings.find((f: any) => f.item_id === item.id);
            if (finding && item.last_updated_by !== "USER") {
              return {
                ...item,
                status: finding.status,
                confidence: finding.confidence,
                evidence: finding.evidence || [],
                last_updated_by: "AGENT" as const,
              };
            }
            return item;
          }),
        }));
        return updated;
      });

      const assessedCount = findings.length;
      toast({
        title: "Analysis Complete",
        description: `AI assessed ${assessedCount} checklist item${assessedCount !== 1 ? "s" : ""}. Review flagged items.`,
      });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast({
        title: "Analysis Failed",
        description: err.message || "Could not analyze images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [inspection.images, inspection.checklist, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SiteSafe Agent</h1>
              <p className="text-[11px] text-muted-foreground font-mono">AI Safety Inspection</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel */}
          <div className="lg:col-span-4 space-y-5">
            {/* Header form */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Inspection Details</h2>
              <InspectionHeaderForm header={inspection.header} onChange={updateHeader} />
            </div>

            {/* Image gallery */}
            <div className="rounded-lg border bg-card p-4">
              <ImageGallery
                images={inspection.images}
                onAdd={addImages}
                onRemove={removeImage}
                selectedId={selectedImageId}
                onSelect={setSelectedImageId}
                isUploading={isUploading}
              />
            </div>

            {/* Analysis controls */}
            <div className="space-y-3">
              <AnalysisButton
                isAnalyzing={isAnalyzing}
                imageCount={inspection.images.length}
                onClick={runAnalysis}
              />
              <CoverageMeter sections={inspection.checklist} />
              <PhotoSuggestions sections={inspection.checklist} />
            </div>
          </div>

          {/* Right panel - Checklist */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Safety Checklist</h2>
              <div className="flex items-center gap-1.5">
                <Button
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="h-7 text-xs"
                >
                  All Items
                </Button>
                <Button
                  variant={filter === "review" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("review")}
                  className="h-7 text-xs gap-1"
                >
                  <Filter className="h-3 w-3" />
                  Needs Review
                </Button>
              </div>
            </div>
            <ChecklistView
              sections={inspection.checklist}
              images={inspection.images}
              onUpdateItem={updateChecklistItem}
              filter={filter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
