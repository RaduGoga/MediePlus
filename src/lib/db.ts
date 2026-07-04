"use client";

import Dexie, { Table } from "dexie";
import type {
  Task,
  Session,
  PlanSlot,
  RecallItem,
  Momentum,
  ActivityDay,
  Insight,
  MascotStateRow,
  UserSettings,
} from "./types";

// Offline-first: tot trackerul, planul și sesiunile trăiesc în IndexedDB.
export class MedieDB extends Dexie {
  tasks!: Table<Task, number>;
  sessions!: Table<Session, number>;
  plan_slots!: Table<PlanSlot, number>;
  recall_items!: Table<RecallItem, number>;
  momentum!: Table<Momentum, string>;
  activity_days!: Table<ActivityDay, string>;
  insights!: Table<Insight, number>;
  mascot_state!: Table<MascotStateRow, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super("medieplus");
    this.version(1).stores({
      tasks: "++id, status, deadline, materie, tip, creat_la",
      sessions: "++id, task_id, start, finalizata",
      plan_slots: "++id, task_id, data, finalizat",
      recall_items: "++id, session_id, task_id, reluare_la, rezolvat",
      momentum: "user_id",
      activity_days: "key, user_id, data",
      insights: "++id, user_id, generat_la",
      mascot_state: "user_id",
    });
    // v2: profilul elevului (quiz-ul de onboarding). Tabel nou, fără migrare.
    this.version(2).stores({
      settings: "user_id",
    });
  }
}

// Un singur utilizator local (app offline-first, fără cont).
export const LOCAL_USER = "local";

let _db: MedieDB | null = null;

// Instanțiere lazy ca să nu rulăm Dexie în timpul SSR/build.
export function getDB(): MedieDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() poate fi apelat doar în client.");
  }
  if (!_db) _db = new MedieDB();
  return _db;
}

// Garantăm că rândurile singleton (momentum, mascot_state) există.
export async function ensureSeed(): Promise<void> {
  const db = getDB();
  const m = await db.momentum.get(LOCAL_USER);
  if (!m) {
    await db.momentum.put({
      user_id: LOCAL_USER,
      streak_zile: 0,
      scor_momentum: 20,
      stare: "normal",
      updated_at: Date.now(),
    });
  }
  const mascot = await db.mascot_state.get(LOCAL_USER);
  if (!mascot) {
    await db.mascot_state.put({
      user_id: LOCAL_USER,
      stare_curenta: "idle",
      glow_level: 0.4,
    });
  }
}
