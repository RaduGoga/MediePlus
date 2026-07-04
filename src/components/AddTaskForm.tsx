"use client";

import { useState } from "react";
import { addTask } from "@/lib/actions";
import type { TaskType } from "@/lib/types";

const TIPURI: { tip: TaskType; label: string; durata: number }[] = [
  { tip: "scriere", label: "Scriere", durata: 90 },
  { tip: "recapitulare", label: "Recap", durata: 45 },
  { tip: "exercitii", label: "Exerciții", durata: 50 },
  { tip: "citit", label: "Citit", durata: 40 },
  { tip: "memorare", label: "Memorare", durata: 40 },
  { tip: "proiect", label: "Proiect", durata: 120 },
  { tip: "altele", label: "Altele", durata: 45 },
];

export function AddTaskForm({ onDone }: { onDone?: () => void }) {
  const [titlu, setTitlu] = useState("");
  const [tip, setTip] = useState<TaskType>("recapitulare");
  const [durata, setDurata] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [materie, setMaterie] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!titlu.trim() || saving) return;
    setSaving(true);
    try {
      await addTask({
        titlu,
        tip,
        durata_min: durata,
        deadline: deadline || undefined,
        materie: materie.trim() || undefined,
        sursa: "manual",
      });
      setTitlu("");
      setMaterie("");
      setDeadline("");
      onDone?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-3">
      <input
        className="input"
        placeholder="Ce ai de făcut? (ex: Eseu la română)"
        value={titlu}
        onChange={(e) => setTitlu(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      <div>
        <span className="label">Ce fel de treabă?</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TIPURI.map((t) => (
            <button
              key={t.tip}
              type="button"
              onClick={() => {
                setTip(t.tip);
                setDurata(t.durata);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                tip === t.tip ? "bg-navy text-soft-white" : "bg-slate-100 text-slate hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Cât durează? ~{durata} min</span>
          <input
            type="range"
            min={15}
            max={180}
            step={5}
            value={durata}
            onChange={(e) => setDurata(Number(e.target.value))}
            className="mt-2 w-full accent-mint"
          />
        </label>
        <label className="block">
          <span className="label">Până când?</span>
          <input
            type="date"
            className="input mt-1"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="label">La ce materie? (dacă vrei)</span>
        <input
          className="input mt-1"
          placeholder="ex: Biologie"
          value={materie}
          onChange={(e) => setMaterie(e.target.value)}
        />
      </label>

      <button className="btn-primary w-full" onClick={submit} disabled={!titlu.trim() || saving}>
        {saving ? "Se adaugă…" : "Adaugă task"}
      </button>
    </div>
  );
}
