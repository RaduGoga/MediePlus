"use client";

import { getDB, LOCAL_USER } from "./db";
import { todayYmd, addDays, daysBetween } from "./dates";
import type { MascotState, MomentumState } from "./types";

export const RECOVERY_THRESHOLD = 30; // sub acest scor intri în recovery

// glow_level (0..1) derivat din scorul de momentum (0..100).
export function glowFromMomentum(scor: number, stare: MomentumState): number {
  const base = Math.max(0, Math.min(100, scor)) / 100;
  if (stare === "recovery") return Math.max(0.25, base * 0.5);
  return 0.35 + base * 0.6; // 0.35 .. 0.95
}

// Starea mascotei derivată din momentum, când nu există o sesiune activă.
export function mascotFromMomentum(scor: number, stare: MomentumState): MascotState {
  if (stare === "recovery") return "recovery";
  if (scor >= 70) return "momentum";
  return "idle";
}

// Înregistrează minute de focus pentru azi și actualizează momentum + heatmap.
export async function recordFocusMinutes(minute: number): Promise<void> {
  if (minute <= 0) return;
  const db = getDB();
  const today = todayYmd();
  const key = `${LOCAL_USER}|${today}`;

  await db.transaction("rw", db.activity_days, db.momentum, db.mascot_state, async () => {
    // Heatmap: adună minutele pe ziua curentă.
    const existing = await db.activity_days.get(key);
    await db.activity_days.put({
      key,
      user_id: LOCAL_USER,
      data: today,
      minute_focus: (existing?.minute_focus ?? 0) + minute,
    });

    const m = await db.momentum.get(LOCAL_USER);
    if (!m) return;

    // Streak: dacă ultima zi de focus a fost ieri → +1; dacă e azi → neschimbat;
    // altfel se resetează la 1.
    let streak = m.streak_zile;
    if (m.ultima_zi_focus === today) {
      // deja punctat azi, streak neschimbat
    } else if (m.ultima_zi_focus && daysBetween(m.ultima_zi_focus, today) === 1) {
      streak = m.streak_zile + 1;
    } else {
      streak = 1;
    }

    // Momentum crește cu consistența (sesiune + bonus de streak), plafonat la 100.
    const castig = 8 + Math.min(streak, 10);
    const scor = Math.min(100, m.scor_momentum + castig);
    const stare: MomentumState = scor >= RECOVERY_THRESHOLD ? "normal" : "recovery";

    await db.momentum.put({
      ...m,
      streak_zile: streak,
      scor_momentum: scor,
      stare,
      ultima_zi_focus: today,
      updated_at: Date.now(),
    });

    await db.mascot_state.put({
      user_id: LOCAL_USER,
      stare_curenta: mascotFromMomentum(scor, stare),
      glow_level: glowFromMomentum(scor, stare),
    });
  });
}

// Decădere blândă: dacă au trecut zile fără focus, momentum scade și putem intra
// în recovery. Apelat la deschiderea aplicației — niciodată acuzator.
export async function decayIfNeeded(): Promise<void> {
  const db = getDB();
  const today = todayYmd();
  const m = await db.momentum.get(LOCAL_USER);
  if (!m || !m.ultima_zi_focus) return;

  const gap = daysBetween(m.ultima_zi_focus, today);
  if (gap <= 0) return; // a făcut focus azi sau dată viitoare — nimic de făcut

  // -7 puncte pe zi ratată; streak-ul se rupe după o zi întreagă fără focus.
  const scor = Math.max(0, m.scor_momentum - gap * 7);
  const streak = gap >= 1 ? 0 : m.streak_zile;
  const stare: MomentumState = scor < RECOVERY_THRESHOLD ? "recovery" : "normal";

  await db.momentum.put({
    ...m,
    scor_momentum: scor,
    streak_zile: streak,
    stare,
    updated_at: Date.now(),
  });
  await db.mascot_state.put({
    user_id: LOCAL_USER,
    stare_curenta: mascotFromMomentum(scor, stare),
    glow_level: glowFromMomentum(scor, stare),
  });
}

// Heatmap: ultimele `nDays` zile cu minutele de focus.
export async function getHeatmap(nDays = 84): Promise<{ data: string; minute: number }[]> {
  const db = getDB();
  const rows = await db.activity_days.where("user_id").equals(LOCAL_USER).toArray();
  const map = new Map(rows.map((r) => [r.data, r.minute_focus]));
  const out: { data: string; minute: number }[] = [];
  let d = addDays(todayYmd(), -(nDays - 1));
  for (let i = 0; i < nDays; i++) {
    out.push({ data: d, minute: map.get(d) ?? 0 });
    d = addDays(d, 1);
  }
  return out;
}
