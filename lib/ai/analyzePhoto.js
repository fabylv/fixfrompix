import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// Stable free vision models — tried in order until one succeeds
const MODELS = [
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "google/gemini-2.0-flash-exp:free",
];

// ─── Prompt ───────────────────────────────────────────────────────────────────
const PROMPT = `You are a professional property inspector AI. Analyze this photo and identify ALL visible repair issues.

Respond ONLY with valid JSON matching one of these two formats:

If the photo is too dark, blurry, too far away, or impossible to analyze:
{"quality":"poor","guidance":"<specific instruction for retaking the photo>"}

If the photo is usable:
{"quality":"good","issues":[{"description":"<specific repair description>","category":"<Roofing|Plumbing|Electrical|HVAC|Structural|Flooring|Painting|Other>","severity":"<high|medium|low>","estimated_cost":<integer USD>,"confidence":<0.0-1.0>}]}

Rules:
- List EVERY visible repair issue, even minor cosmetic ones
- Be specific: e.g. "3-inch crack in drywall near window" not just "wall crack"
- estimated_cost = realistic US contractor price for that specific repair
- confidence = your certainty this is a genuine repair issue (0.0–1.0)
- Return {"quality":"good","issues":[]} if the area looks fine
- Output ONLY the JSON object — no markdown fences, no explanation`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a local device URI to a base64 data URL. */
async function uriToDataUrl(uri, mimeType) {
  if (uri.startsWith("data:")) return uri; // already a data URL

  if (Platform.OS === "web") {
    const res  = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native — expo-file-system
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mimeType};base64,${base64}`;
}

/** Call OpenRouter with one model; throws on non-ok or bad JSON. */
async function callModel(model, dataUrl) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://repairiq.app",
      "X-Title": "RepairIQ",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status} (${model}): ${body.slice(0, 200)}`);
  }

  const json    = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error(`Empty response from ${model}`);

  // Parse JSON — strip markdown fences if present
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Non-JSON response from ${model}: ${content.slice(0, 100)}`);
    parsed = JSON.parse(match[0]);
  }

  return parsed;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Analyze a property photo using OpenRouter free vision models.
 * Always encodes the local URI as base64 — no external URL dependency.
 *
 * @param {{ uri: string, mimeType?: string, photoUrl?: string }} opts
 * @returns {{ quality: 'good'|'poor', issues?: Array, guidance?: string }}
 */
export async function analyzePhoto({ uri, mimeType = "image/jpeg" }) {
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_OPENROUTER_API_KEY is not set in .env.local");
  }

  // Always use local URI → base64 (avoids URL reachability issues)
  const dataUrl = await uriToDataUrl(uri, mimeType);

  let lastError;
  for (const model of MODELS) {
    try {
      console.log(`[analyzePhoto] trying ${model}…`);
      const parsed = await callModel(model, dataUrl);

      // Normalize
      if (!parsed.quality) parsed.quality = "good";
      if (parsed.quality === "good" && !Array.isArray(parsed.issues)) parsed.issues = [];

      console.log(`[analyzePhoto] success with ${model}`);
      return parsed;
    } catch (err) {
      console.warn(`[analyzePhoto] ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError ?? new Error("All AI models failed");
}
