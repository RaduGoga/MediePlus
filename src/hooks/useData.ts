"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, LOCAL_USER } from "@/lib/db";
import { todayYmd } from "@/lib/dates";
import { slotsForDay } from "@/lib/planner";
import { getHeatmap } from "@/lib/momentum";

// Reactive hooks peste Dexie (useLiveQuery se reîmprospătează singur la scriere).

export function useMomentum() {
  return useLiveQuery(() => getDB().momentum.get(LOCAL_USER), []);
}

// undefined = se încarcă; null = quiz-ul nu a fost făcut încă.
export function useSettings() {
  return useLiveQuery(
    async () => (await getDB().settings.get(LOCAL_USER)) ?? null,
    []
  );
}

export function useMascot() {
  return useLiveQuery(() => getDB().mascot_state.get(LOCAL_USER), []);
}

export function useTasks() {
  return useLiveQuery(
    () => getDB().tasks.orderBy("creat_la").reverse().toArray(),
    []
  );
}

export function useTodaySlots() {
  return useLiveQuery(() => slotsForDay(todayYmd()), []);
}

export function useHeatmap(nDays = 84) {
  return useLiveQuery(() => getHeatmap(nDays), [nDays]);
}

export function useDueRecall() {
  const today = todayYmd();
  // Boolean-ele nu se indexează curat în Dexie; filtrăm în JS pe
  // rezolvat=false și reluare_la <= azi (repetiție spațiată ușoară).
  return useLiveQuery(
    () =>
      getDB()
        .recall_items.toArray()
        .then((rows) => rows.filter((r) => !r.rezolvat && r.reluare_la <= today)),
    [today]
  );
}

export function useInsights() {
  return useLiveQuery(
    () =>
      getDB()
        .insights.where("user_id")
        .equals(LOCAL_USER)
        .reverse()
        .sortBy("generat_la"),
    []
  );
}
