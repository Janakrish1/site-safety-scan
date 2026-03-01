# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture

**SiteSafe Agent** is a single-page React app for AI-assisted construction site safety inspections.

### Data flow
All state lives in a single `Inspection` object in `src/pages/Index.tsx`. Components receive slices via props and call updater callbacks. There is no global state manager (no Zustand, Redux, etc.) — `useState` + `useCallback` at the page level is the pattern.

### Key types (`src/types/inspection.ts`)
- `ChecklistItem` — one safety question; has `status` (YES/NO/NA/UNKNOWN), `confidence` (0–1), `evidence[]`, and `last_updated_by` (AGENT | USER)
- `ChecklistSection` — named group of items (e.g. "Fire Prevention", "Scaffolding")
- `Inspection` — top-level object: `header`, `images[]`, `checklist[]`

### Checklist schema (`src/data/checklist-schema.ts`)
`createChecklistSchema()` generates the 12-section, ~70-item default checklist. Item IDs are derived from section name + item number (e.g. `fire-prevention-1`). This ID format is what the AI edge function uses to map findings back to checklist items.

### AI analysis (`supabase/functions/analyze-site/index.ts`)
A Supabase Edge Function (Deno runtime) that:
1. Receives images as base64 data URLs + the checklist schema
2. Calls Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `google/gemini-2.5-flash` vision model
3. Returns `{ findings: [...] }` where each finding has `item_id`, `status`, `confidence`, `evidence[]`

The edge function requires the `LOVABLE_API_KEY` environment secret. JWT verification is disabled (`verify_jwt = false` in `supabase/config.toml`).

**User edits are protected**: In `Index.tsx` `runAnalysis()`, AI findings only overwrite items where `last_updated_by !== "USER"`, so manual user changes are never clobbered.

### Supabase client
`src/integrations/supabase/client.ts` is auto-generated. Configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars.

### Testing
Tests use Vitest + jsdom + @testing-library/react. Setup file at `src/test/setup.ts` mocks `window.matchMedia`. Test files go in `src/**/*.{test,spec}.{ts,tsx}`.

### Path alias
`@/` maps to `src/` throughout the codebase (configured in both `vite.config.ts` and `vitest.config.ts`).
