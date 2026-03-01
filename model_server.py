#!/usr/bin/env python3
"""
Local inference server for the fine-tuned Gemma-3-4B-IT LoRA model.
Exposes POST /analyze compatible with the SiteSafe frontend.

Usage:
    pip install -r requirements_model.txt
    python model_server.py
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
from contextlib import asynccontextmanager
from typing import List

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from peft import PeftModel
from PIL import Image
from pydantic import BaseModel
from transformers import AutoProcessor, Gemma3ForConditionalGeneration

ADAPTER_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "fine_tuned_model",
    "lora_adapter",
)
BASE_MODEL_ID = "google/gemma-3-4b-it"

SYSTEM_PROMPT = """You are a Construction Safety Inspection Agent. You analyze jobsite photos and fill a construction safety checklist.

RULES:
- For each checklist item you can identify evidence for, return a status: YES, NO, or NA.
- Only mark YES if you see direct positive evidence (object present, readable label, etc.).
- Only mark NO if there is affirmative evidence of non-compliance (e.g., empty extinguisher cabinet, blocked access, clearly missing required signage in a visible area).
- Otherwise, leave as UNKNOWN. Default to UNKNOWN rather than guessing.
- Provide a confidence score 0-1 for each assessed item.
- Reference which image(s) support each finding using their image_id.
- Provide a brief snippet_text rationale for each finding.

OUTPUT FORMAT:
Return a JSON object with a "findings" array. Each finding:
{
  "item_id": "string (matches checklist item id, e.g. 'fire-prevention-1')",
  "status": "YES" | "NO" | "NA",
  "confidence": 0.0-1.0,
  "evidence": [{
    "image_id": "string",
    "snippet_text": "brief rationale",
    "detector_labels": ["label1", "label2"]
  }]
}

Only include items where you found relevant evidence. All other items remain UNKNOWN.
Return ONLY the JSON object, no markdown formatting."""

model: Gemma3ForConditionalGeneration | None = None
processor: AutoProcessor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor
    print(f"Loading base model {BASE_MODEL_ID} ...")
    base = Gemma3ForConditionalGeneration.from_pretrained(
        BASE_MODEL_ID,
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )
    print(f"Applying LoRA adapter from {ADAPTER_PATH} ...")
    model = PeftModel.from_pretrained(base, ADAPTER_PATH)
    model.eval()
    processor = AutoProcessor.from_pretrained(ADAPTER_PATH)
    print("Model ready — listening on http://localhost:8000")
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImageItem(BaseModel):
    id: str
    filename: str
    data_url: str


class AnalyzeRequest(BaseModel):
    images: List[ImageItem]
    checklist_schema: List[dict]


@app.get("/health")
def health():
    return {"status": "ready" if model is not None else "loading"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    # Decode base64 data URLs to PIL images
    pil_images: list[Image.Image] = []
    for img in request.images:
        match = re.match(r"^data:([^;]+);base64,(.+)$", img.data_url)
        if match:
            raw = base64.b64decode(match.group(2))
            pil_images.append(Image.open(io.BytesIO(raw)).convert("RGB"))

    text_prompt = (
        f"Analyze these {len(request.images)} jobsite photo(s) against the following "
        "construction safety checklist.\n\n"
        "Image IDs for reference:\n"
        + "\n".join(f"- {img.id} ({img.filename})" for img in request.images)
        + f"\n\nCHECKLIST SCHEMA:\n{json.dumps(request.checklist_schema, indent=2)}\n\n"
        "Analyze each image carefully. Identify safety equipment, signage, PPE, hazards, "
        "and any items relevant to the checklist. Return your findings as JSON."
    )

    # One {"type": "image"} placeholder per image, then the text prompt
    user_content = [{"type": "image"} for _ in pil_images]
    user_content.append({"type": "text", "text": text_prompt})

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    text = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = processor(
        text=text,
        images=pil_images if pil_images else None,
        return_tensors="pt",
    ).to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=2048,
            do_sample=True,
            temperature=0.1,
            top_p=0.9,
        )

    # Decode only the newly generated tokens
    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    response_text = processor.decode(new_tokens, skip_special_tokens=True)

    # Parse JSON from response (handle optional markdown code fences)
    try:
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response_text)
        raw_json = json_match.group(1).strip() if json_match else response_text.strip()
        findings_data = json.loads(raw_json)
    except json.JSONDecodeError:
        print("Failed to parse model response:", response_text)
        findings_data = {"findings": []}

    return findings_data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
