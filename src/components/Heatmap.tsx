"use client";

import { useHeatmap } from "@/hooks/useData";
import { prettyDateRo } from "@/lib/dates";

// Heatmap de activitate — „cât din ritm ai ținut", pe minute de focus (nu pe
// note). 12 săptămâni, stil GitHub.

function level(min: number): number {
  if (min <= 0) return 0;
  if (min < 25) return 1;
  if (min < 60) return 2;
  if (min < 120) return 3;
  return 4;
}

const COLORS = [
  "bg-slate-100",
  "bg-mint/30",
  "bg-mint/55",
  "bg-mint/80",
  "bg-mint",
];

export function Heatmap() {
  const data = useHeatmap(84);
  if (!data) return <div className="h-24 animate-pulse rounded-xl bg-slate-100" />;

  // Grupăm în coloane de câte 7 (săptămâni).
  const weeks: { data: string; minute: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  const totalMin = data.reduce((a, b) => a + b.minute, 0);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.data}
                title={`${prettyDateRo(day.data)} — ${day.minute} min focus`}
                className={`h-3.5 w-3.5 rounded-[3px] ${COLORS[level(day.minute)]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate">
        <span>{Math.round(totalMin / 60)}h de focus în 12 săptămâni</span>
        <span className="flex items-center gap-1">
          mai puțin
          {COLORS.map((c, i) => (
            <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />
          ))}
          mai mult
        </span>
      </div>
    </div>
  );
}
