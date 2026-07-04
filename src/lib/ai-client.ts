"use client";

import type { ParsedTask } from "./types";

// Apeluri client → rutele server /api/ai/*. Niciodată cheia în client.

export async function requestParse(text: string, date: string): Promise<ParsedTask[]> {
  try {
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, date }),
    });
    const data = await res.json();
    return Array.isArray(data?.tasks) ? data.tasks : [];
  } catch {
    return [];
  }
}

export async function requestRecall(
  titlu: string,
  materie?: string,
  profil?: string
): Promise<{ intrebare: string; reluare_zile: number }> {
  try {
    const res = await fetch("/api/ai/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titlu, materie, profil }),
    });
    return await res.json();
  } catch {
    return { intrebare: "Într-o frază, ce ai reținut din sesiunea asta?", reluare_zile: 3 };
  }
}

export async function requestBriefing(input: {
  nrTaskuri: number;
  minuteFocus: number;
  stare: "normal" | "recovery";
  streak: number;
  celMaiImportant?: string;
  profil?: string;
}): Promise<string> {
  try {
    const res = await fetch("/api/ai/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return typeof data?.text === "string" ? data.text : "";
  } catch {
    return "Bună! Hai să prindem ritm azi.";
  }
}
