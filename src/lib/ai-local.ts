// Fallback AI LOCAL (fără rețea, fără cheie) — parser/recall/briefing euristic în
// limba română. Aplicația funcționează complet chiar și fără GEMINI_API_KEY;
// când cheia există, gemini.ts preia și acesta rămâne plasă de siguranță.

import type { ParsedTask } from "./types";

// ——— Utilitare de dată (server-safe, fără import client) ———
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

// ——— Dicționare RO ———
const MATERII: Record<string, string> = {
  romana: "Română",
  română: "Română",
  romania: "Română",
  mate: "Matematică",
  matematica: "Matematică",
  matematică: "Matematică",
  bio: "Biologie",
  biologie: "Biologie",
  fizica: "Fizică",
  fizică: "Fizică",
  chimie: "Chimie",
  istorie: "Istorie",
  geografie: "Geografie",
  geo: "Geografie",
  engleza: "Engleză",
  engleză: "Engleză",
  franceza: "Franceză",
  franceză: "Franceză",
  informatica: "Informatică",
  informatică: "Informatică",
  info: "Informatică",
};

const ZILE: Record<string, number> = {
  duminica: 0, duminică: 0,
  luni: 1,
  marti: 2, marți: 2,
  miercuri: 3,
  joi: 4,
  vineri: 5,
  sambata: 6, sâmbătă: 6, sambata2: 6,
};

interface TipDef {
  tip: string;
  durata: number;
  cuvinte: string[];
}
const TIPURI: TipDef[] = [
  { tip: "scriere", durata: 90, cuvinte: ["eseu", "compun", "scrie", "scris", "redact", "referat", "comentariu"] },
  { tip: "recapitulare", durata: 45, cuvinte: ["recap", "recapitul", "repet", "revizui", "reia"] },
  { tip: "memorare", durata: 40, cuvinte: ["memor", "învăț", "invat", "învața", "formule", "poezie", "vocabular"] },
  { tip: "exercitii", durata: 50, cuvinte: ["exerci", "probleme", "rezolv", "calcul", "fișă", "fisa"] },
  { tip: "citit", durata: 40, cuvinte: ["citește", "citesc", "citit", "lectur", "lectura", "lectură"] },
  { tip: "proiect", durata: 120, cuvinte: ["proiect", "prezentar", "powerpoint", "ppt", "poster"] },
];

function stripDiacritics(s: string): string {
  return s
    .replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i")
    .replace(/ș/g, "s").replace(/ş/g, "s")
    .replace(/ț/g, "t").replace(/ţ/g, "t");
}

function detectTip(clauza: string): TipDef {
  const c = stripDiacritics(clauza.toLowerCase());
  for (const t of TIPURI) {
    if (t.cuvinte.some((w) => c.includes(stripDiacritics(w)))) return t;
  }
  // „test/simulare/examen" → recapitulare implicit
  if (/(test|simular|examen|bac|evaluar)/.test(c)) {
    return { tip: "recapitulare", durata: 60, cuvinte: [] };
  }
  return { tip: "altele", durata: 45, cuvinte: [] };
}

function detectMaterie(clauza: string): string | undefined {
  const words = stripDiacritics(clauza.toLowerCase()).split(/[^a-z]+/);
  for (const w of words) {
    for (const key of Object.keys(MATERII)) {
      if (stripDiacritics(key) === w) return MATERII[key];
    }
  }
  return undefined;
}

function detectDeadline(clauza: string, now: Date): string | undefined {
  const c = stripDiacritics(clauza.toLowerCase());
  if (/\bazi\b/.test(c)) return ymd(now);
  if (/\bmaine\b/.test(c)) return ymd(addDays(now, 1));
  if (/poimaine/.test(c)) return ymd(addDays(now, 2));

  // „peste N zile"
  const peste = c.match(/peste (\d+) zile?/);
  if (peste) return ymd(addDays(now, parseInt(peste[1], 10)));

  // Zi a săptămânii: „până joi", „joi", „de luni"
  for (const [zi, dow] of Object.entries(ZILE)) {
    const z = stripDiacritics(zi);
    if (new RegExp(`\\b${z}\\b`).test(c)) {
      const cur = now.getDay();
      let diff = (dow - cur + 7) % 7;
      if (diff === 0) diff = 7; // „joi" înseamnă joia care vine
      return ymd(addDays(now, diff));
    }
  }

  // Dată explicită ISO sau zz.ll
  const iso = clauza.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dl = clauza.match(/\b(\d{1,2})[.\/](\d{1,2})\b/);
  if (dl) {
    const day = parseInt(dl[1], 10);
    const mon = parseInt(dl[2], 10);
    let year = now.getFullYear();
    const cand = new Date(year, mon - 1, day);
    if (cand < now) year++;
    return ymd(new Date(year, mon - 1, day));
  }
  return undefined;
}

function titleCase(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function cleanTitle(clauza: string): string {
  // Scoatem cuvinte de legătură de la început.
  let t = clauza.trim();
  t = t.replace(/^(de |sa |să |am |trebuie |vreau |o |un |niste |niște )+/i, "");
  // Tăiem partea de deadline din titlu ca să rămână curat.
  t = t.replace(/\b(pana|până|de)?\s*(azi|maine|mâine|poimaine|luni|marti|marți|miercuri|joi|vineri|sambata|sâmbătă|duminica|duminică)\b.*$/i, "");
  t = t.replace(/peste \d+ zile?.*$/i, "");
  return titleCase(t) || titleCase(clauza);
}

// Parser principal: frază RO → taskuri.
export function localParse(text: string, dateISO: string): ParsedTask[] {
  const now = dateISO ? new Date(dateISO + "T12:00:00") : new Date();
  // Împărțim pe „și", virgule, „plus", puncte.
  const clauze = text
    .split(/\s+(?:si|și)\s+|[,;]|\bplus\b|\.\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const tasks: ParsedTask[] = [];
  for (const clauza of clauze) {
    const def = detectTip(clauza);
    const materie = detectMaterie(clauza);
    const deadline = detectDeadline(clauza, now);
    let titlu = cleanTitle(clauza);
    if (materie && !stripDiacritics(titlu.toLowerCase()).includes(stripDiacritics(materie.toLowerCase()))) {
      titlu = `${titlu} (${materie})`;
    }
    tasks.push({
      titlu: titlu.slice(0, 80),
      tip: def.tip,
      durata_min: def.durata,
      deadline,
      materie,
    });
  }
  return tasks.length ? tasks : [];
}

// Recall local: o întrebare scurtă de fixare pe baza titlului sesiunii.
export function localRecall(titlu: string, materie?: string): { intrebare: string; reluare_zile: number } {
  const t = titlu.replace(/\(.*?\)/g, "").trim();
  const variante = [
    `În două cuvinte, care e ideea principală de la „${t}"?`,
    `Spune cu cuvintele tale, într-o frază, ce ai reținut din „${t}".`,
    `Care e cel mai important lucru pe care l-ai învățat acum la „${t}"?`,
    `Dacă ar trebui să explici unui coleg „${t}", de unde ai începe?`,
  ];
  const idx = Math.abs(hash(t)) % variante.length;
  return { intrebare: variante[idx], reluare_zile: 3 };
}

// Briefing local: text scurt pe vocea lui Lumi.
export function localBriefing(input: {
  nrTaskuri: number;
  minuteFocus: number;
  stare: "normal" | "recovery";
  streak: number;
  celMaiImportant?: string;
}): string {
  const { nrTaskuri, minuteFocus, stare, streak, celMaiImportant } = input;
  if (stare === "recovery") {
    return `Bună! Azi o luăm ușor. ${nrTaskuri > 0 ? `Avem ${nrTaskuri} ${nrTaskuri === 1 ? "task" : "taskuri"}, dar începem cu o singură sesiune mică` : "O singură sesiune scurtă e de ajuns ca să intrăm la loc în ritm."}. Sunt aici cu tine.`;
  }
  const parts: string[] = [];
  if (nrTaskuri === 0) {
    parts.push("Azi ai agenda liberă — adaugă ce ai de făcut și îți fac un plan.");
  } else {
    parts.push(
      `Azi ai ${nrTaskuri} ${nrTaskuri === 1 ? "task" : "taskuri"} și ${minuteFocus} min de focus planificate${celMaiImportant ? `; cel mai important: ${celMaiImportant}` : ""}.`
    );
  }
  if (streak >= 2) parts.push(`Ești pe un streak de ${streak} zile — bravo, ține-o tot așa.`);
  else parts.push("Hai să începem — o sesiune bună schimbă toată ziua.");
  return parts.join(" ");
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
