# SiteSafe Agent

An AI-powered construction site safety inspection tool. Upload jobsite photos, let the AI analyse them against a structured safety checklist, then export a PDF report — all in the browser.

---

## Problem Statement

Construction site safety inspections are labour-intensive and inconsistent. Inspectors must manually walk through dozens of checklist items across fire prevention, PPE, scaffolding, excavation, electrical safety, and more — often under time pressure and with incomplete documentation.

**SiteSafe Agent** replaces the manual photo-review step with a multimodal AI pipeline: inspectors upload photos, and the agent automatically maps visual evidence to each checklist item, assigns a compliance status (YES / NO / N/A), and provides a confidence score with a rationale. Human inspectors review and override AI findings before exporting a signed-off PDF report.

---

## Features

- **AI-assisted checklist completion** — Gemini 2.5 Flash vision model analyses uploaded photos and populates a 12-section, ~70-item safety checklist automatically.
- **Human-in-the-loop overrides** — User edits are never overwritten by subsequent AI runs; `last_updated_by` tracks whether each item was set by the agent or the inspector.
- **Evidence traceability** — Each AI finding references the source image ID and a short rationale snippet.
- **Coverage meter** — Visual indicator of how many items have been assessed vs. left unknown.
- **Inspector remarks** — Free-text remarks field included in the exported report.
- **PDF export** — One-click export generates a formatted A4 report with inspection header, per-section tables (status colour-coded), confidence percentages, evidence notes, and a compliance summary.
- **Checklist filtering** — Toggle between "All Items" and "Needs Review" views.

### Checklist sections (12 total)

| # | Section |
|---|---------|
| 1 | Jobsite General |
| 2 | Housekeeping & Sanitation |
| 3 | Fire Prevention |
| 4 | Hazard Communication |
| 5 | Electrical |
| 6 | Personal Protective Equipment |
| 7 | Tools & Equipment |
| 8 | Ladders |
| 9 | Scaffolding |
| 10 | Excavation |
| 11 | Heavy Equipment |
| 12 | Motor Vehicles |

---

## Models Used

### Cloud — Gemini 2.5 Flash (default)
Google's `gemini-2.5-flash` multimodal model is called directly from the browser via the [Gemini API](https://ai.google.dev/). Images are sent as base64 inline data alongside the checklist schema; the model returns a structured JSON findings array.

### Local — Fine-tuned Gemma 3 4B (optional)
A LoRA adapter fine-tuned on top of `google/gemma-3-4b-it` is served by a local FastAPI server (`model_server.py`). The adapter is stored in `fine_tuned_model/lora_adapter/`. This path is useful for offline use or when you want to run inference on your own hardware without sending images to an external API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI components | shadcn/ui, Tailwind CSS, Radix UI |
| AI (cloud) | Google Gemini 2.5 Flash via Gemini API |
| AI (local) | Gemma 3 4B-IT + PEFT LoRA, served by FastAPI + Uvicorn |
| PDF export | jsPDF + jspdf-autotable |
| Icons | Lucide React |

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone and install

```bash
git clone <YOUR_GIT_URL>
cd site-safety-scan
npm install
```

### 2. Set environment variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build locally
```

### Other commands

```bash
npm run lint        # ESLint
npm test            # Run tests once (Vitest)
npm run test:watch  # Run tests in watch mode
```

---

## Running the Local Fine-tuned Model (optional)

The local model server is only needed if you want to use the fine-tuned Gemma model. It requires Python 3.11+ and a Hugging Face account with the Gemma licence accepted.

### 1. Accept the Gemma licence

Visit [https://huggingface.co/google/gemma-3-4b-it](https://huggingface.co/google/gemma-3-4b-it) and accept the licence.

### 2. Create a Hugging Face token

Visit [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) and create a read token.

### 3. Install Python dependencies

```bash
python3.11 -m pip install -r requirements_model.txt
```

### 4. Start the model server

```bash
export HF_TOKEN=hf_your_token_here
python3.11 model_server.py
```

The server listens on `http://localhost:8000`. On first run it downloads the base model (~8 GB); subsequent runs use the local cache.

> **Hardware note:** The model runs on CUDA, Apple MPS (M-series), or CPU. MPS is recommended on Apple Silicon for reasonable inference speed.

---

## Project Structure

```
site-safety-scan/
├── src/
│   ├── pages/Index.tsx          # Main page — all app state lives here
│   ├── components/              # UI components (checklist, gallery, etc.)
│   ├── data/checklist-schema.ts # 12-section checklist definition
│   ├── types/inspection.ts      # Core TypeScript types
│   └── lib/exportPdf.ts         # PDF generation logic
├── fine_tuned_model/
│   └── lora_adapter/            # LoRA weights for the local Gemma model
├── model_server.py              # FastAPI server for local inference
├── requirements_model.txt       # Python dependencies for local model
└── public/
    └── favicon.svg              # Hard hat + AI check favicon
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key for cloud analysis |
| `HF_TOKEN` | Only for local model | Hugging Face token to download Gemma |
