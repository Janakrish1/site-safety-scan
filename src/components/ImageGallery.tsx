import { useCallback, useRef, useState } from "react";
import type { ImageAsset } from "@/types/inspection";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: ImageAsset[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  isUploading?: boolean;
}

export function ImageGallery({ images, onAdd, onRemove, selectedId, onSelect, isUploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
      );
      if (files.length) onAdd(files);
    },
    [onAdd]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-accent" />
          Site Photos
          <span className="text-muted-foreground font-normal">({images.length})</span>
        </h3>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-8 w-8 mx-auto text-accent animate-spin" />
        ) : (
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {isUploading ? "Uploading…" : "Drop images or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, WebP</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                "relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all aspect-square",
                selectedId === img.id ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-accent/40"
              )}
              onClick={() => onSelect(img.id)}
            >
              <img
                src={img.url}
                alt={img.filename}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {img.annotations && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 px-1.5 py-0.5">
                  <p className="text-[9px] text-primary-foreground truncate font-mono">
                    {img.annotations.labels.slice(0, 3).join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
