export type ItemStatus = "YES" | "NO" | "NA" | "UNKNOWN";
export type UpdatedBy = "AGENT" | "USER";

export interface EvidenceRef {
  image_id: string;
  snippet_text: string;
  bbox?: { x: number; y: number; w: number; h: number };
  detector_labels?: string[];
  ocr_text?: string;
}

export interface ChecklistItem {
  id: string;
  section_name: string;
  item_number: number;
  question_text: string;
  status: ItemStatus;
  confidence: number;
  evidence: EvidenceRef[];
  date_corrected: string;
  notes: string;
  last_updated_by: UpdatedBy;
}

export interface ChecklistSection {
  name: string;
  items: ChecklistItem[];
}

export interface ImageAsset {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
  annotations?: {
    labels: string[];
    ocr_texts: string[];
  };
}

export interface InspectionHeader {
  company_name: string;
  jobsite_address: string;
  superintendent: string;
  date_time: string;
  inspectors: string[];
}

export interface Inspection {
  id: string;
  header: InspectionHeader;
  created_at: string;
  updated_at: string;
  images: ImageAsset[];
  checklist: ChecklistSection[];
}
