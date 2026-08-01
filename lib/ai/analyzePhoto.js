import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const MODEL   = "google/gemini-2.0-flash-exp:free"; // free vision model via OpenRouter

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

/** Convert a local URI to a base64 data URL (fallback when no public URL). */
async function toBase64DataUrl(uri, mimeType) {
  if (uri.startsWith("data:")) return uri;

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

  // Native — use expo-file-system
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mimeType};base64,${base64}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Analyze a property photo using OpenRouter's free Gemini vision model.
 *
 * @param {{ photoUrl?: string, uri: string, mimeType?: string }} opts
 *   photoUrl — Supabase public URL (preferred; avoids large base64 payload)
 *   uri      — local device URI (fallback)
 *   mimeType — defaults to "image/jpeg"
 *
 * @returns {{ quality: 'good'|'poor', issues?: Array, guidance?: string }}
 */
export async function analyzePhoto({ photoUrl, uri, mimeType = "image/jpeg" }) {
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_OPENROUTER_API_KEY is not set in .env.local");
  }

  // Prefer the Supabase public URL; fall back to base64 from local URI
  const imageUrl = photoUrl ?? (await toBase64DataUrl(uri, mimeType));

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://repairiq.app",
      "X-Title": "RepairIQ",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
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
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const json    = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";

  // Parse JSON — strip markdown fences if the model wraps its output
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned a non-JSON response");
    parsed = JSON.parse(match[0]);
  }

  // Normalize
  if (!parsed.quality) parsed.quality = "good";
  if (parsed.quality === "good" && !Array.isArray(parsed.issues)) parsed.issues = [];

  return parsed;
}
