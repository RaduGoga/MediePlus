"use client";

import { getDB, LOCAL_USER } from "./db";
import type { UserSettings } from "./types";

// Profilul elevului — scris de quiz-ul de onboarding, citit de planner și de
// apelurile AI (briefing, recall) pentru personalizare.

export async function getSettings(): Promise<UserSettings | null> {
  return (await getDB().settings.get(LOCAL_USER)) ?? null;
}

export async function saveSettings(
  s: Omit<UserSettings, "user_id" | "updated_at">
): Promise<void> {
  await getDB().settings.put({
    ...s,
    user_id: LOCAL_USER,
    updated_at: Date.now(),
  });
}

// Redeschide quiz-ul (răspunsurile rămân ca pre-completare).
export async function reopenOnboarding(): Promise<void> {
  const s = await getSettings();
  if (s) await getDB().settings.update(LOCAL_USER, { onboarded: false });
}

const NIVEL_TXT: Record<string, string> = {
  scoala: "școală generală",
  liceu: "liceu",
  facultate: "facultate",
};
const PROFIL_TXT: Record<string, string> = {
  uman: "profil uman",
  real: "profil real",
  stiinte: "profil științe ale naturii",
  altul: "",
};
const PREF_TXT: Record<string, string> = {
  dimineata: "învață cel mai bine dimineața",
  dupa_amiaza: "învață cel mai bine după-amiaza",
  seara: "învață cel mai bine seara",
};

// Rezumat în limbaj natural pentru prompturile AI (briefing, recall).
export function profileSummary(s: UserSettings | null): string | undefined {
  if (!s) return undefined;
  const parts: string[] = [];
  if (s.clasa) parts.push(`clasa ${s.clasa}`);
  parts.push(NIVEL_TXT[s.nivel] ?? s.nivel);
  if (s.profil && PROFIL_TXT[s.profil]) parts.push(PROFIL_TXT[s.profil]);
  parts.push(PREF_TXT[s.preferinta_ora] ?? "");
  return parts.filter(Boolean).join(", ");
}

// Rezumat scurt pentru UI („Profilul tău" pe pagina Plan).
export function profileShort(s: UserSettings): string {
  const parts: string[] = [];
  if (s.clasa) parts.push(s.clasa);
  else parts.push(NIVEL_TXT[s.nivel] ?? s.nivel);
  if (s.profil && PROFIL_TXT[s.profil]) parts.push(PROFIL_TXT[s.profil]);
  const pref = {
    dimineata: "dimineața",
    dupa_amiaza: "după-amiaza",
    seara: "seara",
  }[s.preferinta_ora];
  if (pref) parts.push(`înveți ${pref}`);
  return parts.join(" · ");
}
