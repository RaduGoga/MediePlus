"use client";

import Link from "next/link";
import type { PlanSlot, Task } from "@/lib/types";
import { dayShortRo, prettyDateRo } from "@/lib/dates";

const TIP_LABEL: Record<string, string> = {
  scriere: "Scriere",
  recapitulare: "Recap",
  citit: "Citit",
  exercitii: "Exerciții",
  proiect: "Proiect",
  memorare: "Memorare",
  altele: "Task",
};

type Slot = PlanSlot & { task?: Task };

export function PlanList({
  slots,
  showDay = false,
  emptyText = "Nimic planificat încă.",
}: {
  slots?: Slot[];
  showDay?: boolean;
  emptyText?: string;
}) {
  if (!slots) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl2 bg-slate-100" />
        ))}
      </div>
    );
  }
  if (!slots.length) {
    return (
      <div className="rounded-xl2 border border-dashed border-slate-200 p-6 text-center text-sm text-slate">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {slots.map((s, i) => (
        <li key={s.id ?? i}>
          <Link
            href={`/focus?slot=${s.id ?? ""}&task=${s.task_id}`}
            className={`flex items-center gap-3 rounded-xl2 border p-3 transition-colors duration-200 ${
              s.finalizat
                ? "border-mint/40 bg-mint/10"
                : "border-slate-100 bg-white hover:border-mint/60"
            }`}
          >
            <div className="flex w-14 shrink-0 flex-col items-center">
              <span className="font-display text-sm font-bold text-navy">
                {s.ora_start}
              </span>
              {showDay && (
                <span className="text-[10px] text-slate">
                  {dayShortRo(s.data)} {prettyDateRo(s.data)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-navy">
                {s.task?.titlu ?? "Task șters"}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate">
                <span className="chip">{TIP_LABEL[s.task?.tip ?? "altele"]}</span>
                <span>{s.durata} min</span>
                {s.replanificat && <span className="text-amber-600">mutat</span>}
              </div>
            </div>
            {s.finalizat ? (
              <CheckBadge />
            ) : (
              <span className="text-xs font-semibold text-mint">Start →</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CheckBadge() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-navy">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
