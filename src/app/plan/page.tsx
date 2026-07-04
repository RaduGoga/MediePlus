"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db";
import { todayYmd } from "@/lib/dates";
import type { PlanSlot, Task } from "@/lib/types";
import { AddTaskForm } from "@/components/AddTaskForm";
import { TaskList } from "@/components/TaskList";
import { PlanList } from "@/components/PlanList";
import { Heatmap } from "@/components/Heatmap";
import { ProfileCard } from "@/components/ProfileCard";

// Sloturile viitoare (de azi înainte), cu taskul atașat — planul viu complet.
function useUpcomingSlots() {
  const today = todayYmd();
  return useLiveQuery(async () => {
    const db = getDB();
    const slots = await db.plan_slots.where("data").aboveOrEqual(today).toArray();
    slots.sort((a, b) =>
      a.data === b.data ? a.ora_start.localeCompare(b.ora_start) : a.data.localeCompare(b.data)
    );
    const out: (PlanSlot & { task?: Task })[] = [];
    for (const s of slots) out.push({ ...s, task: await db.tasks.get(s.task_id) });
    return out;
  }, [today]);
}

export default function PlanPage() {
  const [showForm, setShowForm] = useState(false);
  const upcoming = useUpcomingSlots();

  return (
    <main className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-navy">Plan</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Închide" : "+ Task"}
        </button>
      </header>

      {showForm && <AddTaskForm onDone={() => setShowForm(false)} />}

      <section className="card">
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Activitatea ta</h2>
        <Heatmap />
      </section>

      <ProfileCard />

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-navy">Taskuri</h2>
        <TaskList />
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-navy">Sesiuni planificate</h2>
        <PlanList
          slots={upcoming}
          showDay
          emptyText="Niciun task de planificat. Adaugă ceva și îți așez sesiunile."
        />
      </section>
    </main>
  );
}
