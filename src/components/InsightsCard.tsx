"use client";

import type { Insight } from "@/lib/types";

// Afișează insight-urile pasive generate din datele de utilizare.
// Primește datele ca prop — pagina le încarcă o singură dată, fără pop-in.
export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-bold text-navy">
        Ce am observat
      </h2>
      <ul className="space-y-2">
        {insights.map((ins) => (
          <li
            key={ins.id}
            className="flex items-start gap-3 rounded-xl2 bg-white p-3 text-sm text-navy shadow-card"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
            <span className="leading-relaxed">{ins.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
