"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { answerRecall, snoozeRecall } from "@/lib/actions";
import type { RecallItem } from "@/lib/types";

// Primește itemele ca prop — pagina decide când e totul gata de afișat.
export function RecallDueCard({ due }: { due: RecallItem[] }) {
  const [raspuns, setRaspuns] = useState("");

  if (due.length === 0) return null;
  const item = due[0];

  return (
    <div className="card border-mint/40 bg-mint/5">
      <div className="flex items-center justify-between">
        <span className="label">Ca să nu uiți ({due.length})</span>
        <button
          onClick={() => item.id && snoozeRecall(item.id, 2)}
          className="text-xs text-slate hover:text-navy"
        >
          mai târziu
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-2 text-sm font-medium text-navy"
        >
          {item.intrebare}
        </motion.p>
      </AnimatePresence>
      <div className="mt-3 flex gap-2">
        <input
          value={raspuns}
          onChange={(e) => setRaspuns(e.target.value)}
          placeholder="Răspunde scurt…"
          className="input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && item.id) {
              answerRecall(item.id, raspuns.trim());
              setRaspuns("");
            }
          }}
        />
        <button
          className="btn-primary shrink-0"
          onClick={() => {
            if (item.id) {
              answerRecall(item.id, raspuns.trim());
              setRaspuns("");
            }
          }}
        >
          Gata
        </button>
      </div>
    </div>
  );
}
