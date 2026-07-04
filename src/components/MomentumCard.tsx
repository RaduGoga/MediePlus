"use client";

import { motion } from "framer-motion";
import type { Momentum } from "@/lib/types";

// Streak + scor de momentum. Primește datele ca prop, ca pagina să poată
// aștepta totul și să intre dintr-o bucată (fără carduri care apar pe rând).
export function MomentumCard({ momentum: m }: { momentum: Momentum }) {
  const recovery = m.stare === "recovery";
  return (
    <div className="card">
      <span className="label text-lg">Streak</span>

      <div className="mt-3 flex items-end gap-4">
        <div>
          <div className="font-display text-3xl font-extrabold text-navy">
            {m.streak_zile}
          </div>
          <div className="text-xs text-slate">
            {m.streak_zile === 1 ? "zi la rând" : "zile la rând"}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-1 text-right text-xs text-slate">
            {Math.round(m.scor_momentum)}%
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={`h-full rounded-full ${recovery ? "bg-amber-400" : "bg-mint"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, m.scor_momentum)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {recovery && (
        <p className="mt-3 text-xs leading-relaxed text-slate">
          Ai lipsit puțin — se întâmplă. O sesiune scurtă azi și Lumi strălucește
          din nou.
        </p>
      )}
    </div>
  );
}
