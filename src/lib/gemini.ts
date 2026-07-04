import "server-only";
import { localParse, localRecall, localBriefing } from "./ai-local";
import type { ParsedTask } from "./types";

// Apeluri AI — DOAR pe server. Cheia (GEMINI_API_KEY) nu ajunge niciodată în
// client. Toate răspunsurile sunt parsate defensiv (try/catch, strip ```json).
// Dacă nu există cheie sau apelul eșuează, cădem elegant pe fallback-ul local.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function hasKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Curăță un răspuns text de fences ```json și extrage primul obiect/array JSON.
export function stripAndParseJSON<T>(raw: string): T {
  let s = raw.trim();
  // Scoatem fence-urile de cod.
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Extragem din prima acoladă/paranteză până la ultima.
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start !== -1) {
    const lastObj = s.lastIndexOf("}");
    const lastArr = s.lastIndexOf("]");
    const end = Math.max(lastObj, lastArr);
    if (end > start) s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as T;
}

// Apel generic la Gemini, cerând output JSON.
async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
    // Răspuns rapid sau renunțăm la fallback.
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Răspuns Gemini gol");
  return text;
}

// ——— Parser conversațional → taskuri ———
export async function aiParse(text: string, dateISO: string): Promise<ParsedTask[]> {
  if (hasKey()) {
    try {
      const prompt = `Ești co-pilotul de productivitate MediePlus+ pentru elevi români.
Transformă fraza de mai jos în taskuri de școală. Data curentă: ${dateISO}.
Returnează STRICT JSON, fără explicații, în forma:
{"tasks":[{"titlu":"...","tip":"scriere|recapitulare|citit|exercitii|proiect|memorare|altele","durata_min":90,"deadline":"YYYY-MM-DD","materie":"..."}]}
Estimează durata realist. Pune deadline doar dacă e menționat (zi a săptămânii relativă la data curentă, "mâine", dată). Omite "deadline"/"materie" dacă lipsesc.
Fraza: "${text.replace(/"/g, "'")}"`;
      const raw = await callGemini(prompt);
      const parsed = stripAndParseJSON<{ tasks: ParsedTask[] }>(raw);
      if (Array.isArray(parsed?.tasks) && parsed.tasks.length) return parsed.tasks;
    } catch {
      /* cădem pe local */
    }
  }
  return localParse(text, dateISO);
}

// ——— Recall → întrebare de fixare ———
export async function aiRecall(
  titlu: string,
  materie?: string,
  profil?: string
): Promise<{ intrebare: string; reluare_zile: number }> {
  if (hasKey()) {
    try {
      const prompt = `Elevul tocmai a terminat o sesiune de focus pe: "${titlu}"${materie ? ` (${materie})` : ""}.${profil ? `\nDespre elev: ${profil}. Adaptează dificultatea și tonul la nivelul lui.` : ""}
Pune-i O întrebare scurtă de fixare (recall activ) SAU cere o reformulare de o frază. Ton cald, în română, fără emoji. Răspunsul NU se notează.
Returnează STRICT JSON: {"intrebare":"...","reluare_zile":3}`;
      const raw = await callGemini(prompt);
      const parsed = stripAndParseJSON<{ intrebare: string; reluare_zile: number }>(raw);
      if (parsed?.intrebare) {
        return {
          intrebare: parsed.intrebare,
          reluare_zile: parsed.reluare_zile > 0 ? parsed.reluare_zile : 3,
        };
      }
    } catch {
      /* cădem pe local */
    }
  }
  return localRecall(titlu, materie);
}

// ——— Briefing zilnic ———
export async function aiBriefing(input: {
  nrTaskuri: number;
  minuteFocus: number;
  stare: "normal" | "recovery";
  streak: number;
  celMaiImportant?: string;
  profil?: string;
}): Promise<string> {
  if (hasKey()) {
    try {
      const prompt = `Ești Lumi, mascota MediePlus+: caldă, încurajatoare, niciodată acuzatoare.
Dă elevului un briefing de dimineață de MAXIM 2 fraze scurte, în română, pe vocea ta, fără emoji.
Context: ${input.nrTaskuri} taskuri azi, ${input.minuteFocus} min focus planificate, stare="${input.stare}", streak=${input.streak} zile${input.celMaiImportant ? `, cel mai important: "${input.celMaiImportant}"` : ""}.${input.profil ? `\nDespre elev: ${input.profil}. Ține cont de asta în ton și recomandări.` : ""}
Dacă starea e "recovery", fii blândă și propune o singură sesiune mică.
Returnează STRICT JSON: {"text":"..."}`;
      const raw = await callGemini(prompt);
      const parsed = stripAndParseJSON<{ text: string }>(raw);
      if (parsed?.text) return parsed.text;
    } catch {
      /* cădem pe local */
    }
  }
  return localBriefing(input);
}
