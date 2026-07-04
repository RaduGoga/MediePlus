"use client";

import { getDB, LOCAL_USER } from "./db";
import { todayYmd, addDays, daysBetween, parseYmd } from "./dates";
import type { Task, PlanSlot, UserSettings } from "./types";

export const SESSION_MIN = 25; // o sesiune de focus standard
const MAX_SESSIONS_PER_DAY = 4;
const PLAN_HORIZON_DAYS = 14;

// Ferestre libere per zi (oră de start pentru fiecare slot disponibil), pe
// ritmul școlii românești, personalizate cu profilul din quiz:
// - facultate → și dimineți libere în timpul săptămânii (orar mai flexibil);
// - preferința orară → sloturile preferate se folosesc primele (dacă ai puține
//   sesiuni, ele cad în fereastra în care înveți cel mai bine).
const WEEKEND_HOURS = [9, 10, 11, 12, 16, 17, 18, 19, 20];
const SCHOOLDAY_HOURS = [15, 16, 17, 18, 19, 20];
const UNI_DAY_HOURS = [10, 11, 12, 15, 16, 17, 18, 19, 20];

const PREF_CENTER: Record<string, number> = {
  dimineata: 9.5,
  dupa_amiaza: 16,
  seara: 19.5,
};

function freeStartHours(dateStr: string, settings: UserSettings | null): string[] {
  const dow = parseYmd(dateStr).getDay(); // 0=Dum .. 6=Sâm
  const weekend = dow === 0 || dow === 6;
  const hours = weekend
    ? [...WEEKEND_HOURS]
    : settings?.nivel === "facultate"
      ? [...UNI_DAY_HOURS]
      : [...SCHOOLDAY_HOURS];

  if (settings) {
    const center = PREF_CENTER[settings.preferinta_ora] ?? 16;
    hours.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  }
  return hours.map((h) => `${String(h).padStart(2, "0")}:00`);
}

interface SessionNeed {
  task: Task;
  greu: boolean; // task "greu" → nu îl stivuim consecutiv
}

// Câte sesiuni are nevoie un task, pe baza minutelor rămase de planificat.
function sessionsFor(task: Task, alreadyPlannedMin: number): number {
  const ramas = Math.max(0, task.durata_min - alreadyPlannedMin);
  return Math.ceil(ramas / SESSION_MIN);
}

const TIPURI_GRELE = new Set(["scriere", "proiect", "memorare"]);

// Regenerează planul pentru taskurile neterminate. `pastreazaFinalizate`
// înseamnă că nu atingem sloturile deja bifate ca finalizate.
export async function replan(): Promise<void> {
  const db = getDB();
  const today = todayYmd();
  // Profilul se citește în afara tranzacției (tabelul settings nu e în scope).
  const settings = (await db.settings.get(LOCAL_USER)) ?? null;

  await db.transaction("rw", db.tasks, db.plan_slots, async () => {
    const tasks = await db.tasks.where("status").notEqual("finalizat").toArray();
    const allSlots = await db.plan_slots.toArray();

    // Păstrăm sloturile finalizate; ștergem restul ca să re-așezăm curat.
    const finalizate = allSlots.filter((s) => s.finalizat);
    const deSters = allSlots.filter((s) => !s.finalizat).map((s) => s.id!).filter(Boolean);
    if (deSters.length) await db.plan_slots.bulkDelete(deSters);

    // Câte minute sunt deja acoperite (finalizate) per task.
    const acoperit = new Map<number, number>();
    for (const s of finalizate) {
      acoperit.set(s.task_id, (acoperit.get(s.task_id) ?? 0) + s.durata);
    }

    // Construim lista de sesiuni necesare, sortate după urgența deadline-ului.
    const needs: SessionNeed[] = [];
    const sorted = [...tasks].sort((a, b) => {
      const da = a.deadline ?? "9999-12-31";
      const dbl = b.deadline ?? "9999-12-31";
      return da.localeCompare(dbl);
    });

    for (const t of sorted) {
      const n = sessionsFor(t, acoperit.get(t.id!) ?? 0);
      for (let i = 0; i < n; i++) {
        needs.push({ task: t, greu: TIPURI_GRELE.has(t.tip) });
      }
    }

    // Câte sesiuni finalizate există deja per zi (ca să nu suprasolicităm o zi).
    const usedPerDay = new Map<string, number>();
    for (const s of finalizate) {
      usedPerDay.set(s.data, (usedPerDay.get(s.data) ?? 0) + 1);
    }

    const newSlots: PlanSlot[] = [];
    // `needs` e o coadă: consumăm mereu din față, dar putem alege o sesiune
    // ușoară mai în spate dacă ultima așezată a fost grea (evităm stivuirea).

    for (let dayOffset = 0; dayOffset < PLAN_HORIZON_DAYS && needs.length; dayOffset++) {
      const data = addDays(today, dayOffset);
      const slotsAzi = freeStartHours(data, settings);
      let lastWasHeavy = false;
      let placedToday = usedPerDay.get(data) ?? 0;

      for (const ora of slotsAzi) {
        if (!needs.length) break;
        if (placedToday >= MAX_SESSIONS_PER_DAY) break;

        // Evităm două taskuri grele consecutiv: dacă fruntea cozii e grea și
        // tocmai am pus una grea, căutăm o sesiune ușoară mai în spate.
        let pick = 0;
        if (lastWasHeavy && needs[0].greu) {
          const alt = needs.findIndex((n) => !n.greu);
          if (alt !== -1) pick = alt;
        }

        const [need] = needs.splice(pick, 1);
        newSlots.push({
          task_id: need.task.id!,
          data,
          ora_start: ora,
          durata: SESSION_MIN,
          replanificat: dayOffset > 0,
          finalizat: false,
        });

        lastWasHeavy = need.greu;
        placedToday++;
      }
    }

    if (newSlots.length) await db.plan_slots.bulkAdd(newSlots);
  });
}

// Sloturile de azi, ordonate după oră, cu titlul taskului atașat.
export async function slotsForDay(
  data: string
): Promise<(PlanSlot & { task?: Task })[]> {
  const db = getDB();
  const slots = await db.plan_slots.where("data").equals(data).toArray();
  slots.sort((a, b) => a.ora_start.localeCompare(b.ora_start));
  const out: (PlanSlot & { task?: Task })[] = [];
  for (const s of slots) {
    out.push({ ...s, task: await db.tasks.get(s.task_id) });
  }
  return out;
}

// Cât din planul de azi a fost respectat (0..1) — pentru heatmap „plan respectat”.
export async function planAdherenceToday(): Promise<number> {
  const slots = await slotsForDay(todayYmd());
  if (!slots.length) return 0;
  const done = slots.filter((s) => s.finalizat).length;
  return done / slots.length;
}

// Zile rămase până la cel mai apropiat deadline activ (pentru briefing).
export async function nearestDeadlineDays(): Promise<number | null> {
  const db = getDB();
  const tasks = await db.tasks.where("status").notEqual("finalizat").toArray();
  const today = todayYmd();
  let best: number | null = null;
  for (const t of tasks) {
    if (!t.deadline) continue;
    const d = daysBetween(today, t.deadline);
    if (best === null || d < best) best = d;
  }
  return best;
}
