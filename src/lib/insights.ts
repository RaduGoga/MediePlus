"use client";

import { getDB, LOCAL_USER } from "./db";

interface Derived {
  text: string;
  tip: "tipar_orar" | "tipar_ritm" | "incurajare" | "general";
}

function fascia(h: number): string {
  if (h < 12) return "dimineața";
  if (h < 17) return "după-amiaza";
  return "seara";
}

// Recalculează insight-urile din sesiunile finalizate și le rescrie în DB.
export async function generateInsights(): Promise<void> {
  const db = getDB();
  const sessions = await db.sessions.where("finalizata").equals(1 as never).toArray()
    .catch(async () => (await db.sessions.toArray()).filter((s) => s.finalizata));

  const done = sessions.filter((s) => s.finalizata && s.durata_reala > 0);
  const derived: Derived[] = [];

  if (done.length >= 3) {
    // Tipar orar: în ce fascie reușești cele mai multe sesiuni.
    const buckets: Record<string, number> = { dimineața: 0, "după-amiaza": 0, seara: 0 };
    for (const s of done) buckets[fascia(new Date(s.start).getHours())]++;
    const best = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    if (best[1] > 0) {
      derived.push({
        text: `Te concentrezi cel mai bine ${best[0]} — îți pun taskurile grele atunci.`,
        tip: "tipar_orar",
      });
    }

    // Tipar ritm: durata medie a sesiunilor reușite.
    const medie = Math.round(done.reduce((a, s) => a + s.durata_reala, 0) / done.length);
    if (medie > 0) {
      derived.push({
        text: `Sesiunile tale reușite durează în medie ${medie} min. Le păstrez scurte ca să rămâi concentrat.`,
        tip: "tipar_ritm",
      });
    }
  } else {
    derived.push({
      text: "Adună câteva sesiuni de focus și încep să-ți observ tiparele — la ce oră mergi cel mai bine, ce te ține în ritm.",
      tip: "general",
    });
  }

  await db.transaction("rw", db.insights, async () => {
    const old = await db.insights.where("user_id").equals(LOCAL_USER).primaryKeys();
    if (old.length) await db.insights.bulkDelete(old as number[]);
    for (const d of derived) {
      await db.insights.add({
        user_id: LOCAL_USER,
        text: d.text,
        tip: d.tip,
        generat_la: Date.now(),
      });
    }
  });
}

// Fascia preferată (pentru a influența planificarea în viitor / briefing).
export async function preferredFascia(): Promise<string | null> {
  const db = getDB();
  const done = (await db.sessions.toArray()).filter((s) => s.finalizata);
  if (done.length < 3) return null;
  const buckets: Record<string, number> = { dimineața: 0, "după-amiaza": 0, seara: 0 };
  for (const s of done) buckets[fascia(new Date(s.start).getHours())]++;
  return Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];
}
