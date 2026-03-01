import { Loader2, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isAnalyzing: boolean;
  imageCount: number;
  onClick: () => void;
}

export function AnalysisButton({ isAnalyzing, imageCount, onClick }: Props) {
  return (
    <Button
      onClick={onClick}
      disabled={isAnalyzing || imageCount === 0}
      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Analyzing {imageCount} image{imageCount !== 1 ? "s" : ""}…
        </>
      ) : imageCount === 0 ? (
        <>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Upload photos to analyze
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 mr-2" />
          Run AI Safety Analysis
        </>
      )}
    </Button>
  );
}
