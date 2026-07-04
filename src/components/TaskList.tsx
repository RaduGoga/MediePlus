"use client";

import { useTasks } from "@/hooks/useData";
import { deleteTask, setTaskStatus } from "@/lib/actions";
import { prettyDateRo, todayYmd, daysBetween } from "@/lib/dates";
import type { Task } from "@/lib/types";

const TIP_LABEL: Record<string, string> = {
  scriere: "Scriere",
  recapitulare: "Recap",
  citit: "Citit",
  exercitii: "Exerciții",
  proiect: "Proiect",
  memorare: "Memorare",
  altele: "Task",
};

function deadlineLabel(d?: string): { text: string; urgent: boolean } | null {
  if (!d) return null;
  const days = daysBetween(todayYmd(), d);
  if (days < 0) return { text: "depășit", urgent: true };
  if (days === 0) return { text: "azi", urgent: true };
  if (days === 1) return { text: "mâine", urgent: true };
  return { text: prettyDateRo(d), urgent: days <= 2 };
}

export function TaskList() {
  const tasks = useTasks();

  if (!tasks) {
    return <div className="h-20 animate-pulse rounded-xl2 bg-slate-100" />;
  }
  if (!tasks.length) {
    return (
      <div className="rounded-xl2 border border-dashed border-slate-200 p-6 text-center text-sm text-slate">
        Niciun task încă. Adaugă unul sau spune-i co-pilotului.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((t: Task) => {
          const dl = deadlineLabel(t.deadline);
          const done = t.status === "finalizat";
          return (
            <li key={t.id}>
              <div className="flex items-center gap-3 rounded-xl2 border border-slate-100 bg-white p-3">
                <button
                  aria-label="Marchează finalizat"
                  onClick={() => setTaskStatus(t.id!, done ? "de_facut" : "finalizat")}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done ? "border-mint bg-mint text-navy" : "border-slate-300 text-transparent hover:border-mint"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-semibold ${done ? "text-slate line-through" : "text-navy"}`}>
                    {t.titlu}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate">
                    <span className="chip">{TIP_LABEL[t.tip]}</span>
                    <span>{t.durata_min} min</span>
                    {t.sursa === "chat" && <span className="text-mint">co-pilot</span>}
                    {dl && (
                      <span className={dl.urgent ? "font-semibold text-amber-600" : ""}>
                        ⏳ {dl.text}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  aria-label="Șterge"
                  onClick={() => t.id && deleteTask(t.id)}
                  className="shrink-0 rounded-full p-1.5 text-slate-light transition hover:bg-slate-100 hover:text-navy"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
