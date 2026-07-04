"use client";

import { getDB, LOCAL_USER } from "./db";
import { replan } from "./planner";
import { recordFocusMinutes } from "./momentum";
import { todayYmd, addDays } from "./dates";
import type {
  Task,
  TaskType,
  ParsedTask,
  Session,
  RecallItem,
} from "./types";

const TIPURI_VALIDE: TaskType[] = [
  "scriere", "recapitulare", "citit", "exercitii", "proiect", "memorare", "altele",
];

function normTip(tip: string): TaskType {
  const t = tip?.toLowerCase().trim();
  return (TIPURI_VALIDE as string[]).includes(t) ? (t as TaskType) : "altele";
}

// ——— Taskuri ———
export async function addTask(
  input: Omit<Task, "id" | "status" | "creat_la"> & { status?: Task["status"] }
): Promise<number> {
  const db = getDB();
  const id = await db.tasks.add({
    titlu: input.titlu.trim().slice(0, 120) || "Task",
    tip: normTip(input.tip),
    durata_min: Math.max(10, Math.min(600, Math.round(input.durata_min) || 45)),
    deadline: input.deadline,
    materie: input.materie,
    status: input.status ?? "de_facut",
    sursa: input.sursa,
    creat_la: Date.now(),
  });
  await replan();
  return id as number;
}

// Adaugă mai multe taskuri venite de la parser (chat).
export async function addParsedTasks(parsed: ParsedTask[]): Promise<number> {
  const db = getDB();
  let n = 0;
  await db.transaction("rw", db.tasks, async () => {
    for (const p of parsed) {
      await db.tasks.add({
        titlu: (p.titlu || "Task").trim().slice(0, 120),
        tip: normTip(p.tip),
        durata_min: Math.max(10, Math.min(600, Math.round(p.durata_min) || 45)),
        deadline: p.deadline,
        materie: p.materie,
        status: "de_facut",
        sursa: "chat",
        creat_la: Date.now() + n, // ordine stabilă
      });
      n++;
    }
  });
  if (n) await replan();
  return n;
}

export async function deleteTask(id: number): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.tasks, db.plan_slots, async () => {
    await db.tasks.delete(id);
    const slots = await db.plan_slots.where("task_id").equals(id).primaryKeys();
    if (slots.length) await db.plan_slots.bulkDelete(slots as number[]);
  });
  await replan();
}

export async function setTaskStatus(id: number, status: Task["status"]): Promise<void> {
  await getDB().tasks.update(id, { status });
  await replan();
}

// ——— Sesiuni de focus ———
export async function startSession(
  taskId: number | undefined,
  microObiectiv: string
): Promise<number> {
  const id = await getDB().sessions.add({
    task_id: taskId,
    start: Date.now(),
    durata_reala: 0,
    micro_obiectiv: microObiectiv.trim(),
    finalizata: false,
  } as Session);
  return id as number;
}

// Închide o sesiune: salvează minutele, marchează un slot ca finalizat,
// actualizează momentum + heatmap, re-planifică.
export async function completeSession(
  sessionId: number,
  minute: number
): Promise<void> {
  const db = getDB();
  const session = await db.sessions.get(sessionId);
  await db.sessions.update(sessionId, { durata_reala: minute, finalizata: true });

  // Marchează primul slot neterminat al taskului de azi ca finalizat.
  if (session?.task_id) {
    const today = todayYmd();
    const slot = await db.plan_slots
      .where("task_id")
      .equals(session.task_id)
      .filter((s) => !s.finalizat && s.data <= today)
      .first();
    if (slot?.id) await db.plan_slots.update(slot.id, { finalizat: true });
  }

  await recordFocusMinutes(minute);
  await replan();
}

// ——— Recall (repetiție spațiată ușoară) ———
export async function addRecall(
  sessionId: number | undefined,
  taskId: number | undefined,
  intrebare: string,
  reluareZile: number
): Promise<number> {
  const id = await getDB().recall_items.add({
    session_id: sessionId,
    task_id: taskId,
    intrebare,
    reluare_la: addDays(todayYmd(), Math.max(1, reluareZile)),
    rezolvat: false,
    creat_la: Date.now(),
  } as RecallItem);
  return id as number;
}

export async function answerRecall(id: number, raspuns: string): Promise<void> {
  await getDB().recall_items.update(id, { raspuns, rezolvat: true });
}

// Reluăm un item peste N zile (spaced repetition) fără a-l marca rezolvat definitiv.
export async function snoozeRecall(id: number, zile = 3): Promise<void> {
  await getDB().recall_items.update(id, {
    reluare_la: addDays(todayYmd(), zile),
  });
}

// ——— Insights pasive ———
export async function addInsight(text: string, tip: string): Promise<void> {
  await getDB().insights.add({
    user_id: LOCAL_USER,
    text,
    tip: tip as never,
    generat_la: Date.now(),
  });
}
