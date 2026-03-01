import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Construction Safety Inspection Agent. You analyze jobsite photos and fill a construction safety checklist.

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
Return ONLY the JSON object, no markdown formatting.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, checklist_schema } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build image content parts for the vision model
    const imageContents = images.map((img: { id: string; data_url: string; filename: string }) => ({
      type: "image_url" as const,
      image_url: { url: img.data_url },
    }));

    const textPart = {
      type: "text" as const,
      text: `Analyze these ${images.length} jobsite photo(s) against the following construction safety checklist.

Image IDs for reference:
${images.map((img: { id: string; filename: string }) => `- ${img.id} (${img.filename})`).join("\n")}

CHECKLIST SCHEMA:
${JSON.stringify(checklist_schema, null, 2)}

Analyze each image carefully. Identify safety equipment, signage, PPE, hazards, and any items relevant to the checklist. Return your findings as JSON.`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [textPart, ...imageContents],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    let findings;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      findings = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      findings = { findings: [] };
    }

    return new Response(JSON.stringify(findings), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-site error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
