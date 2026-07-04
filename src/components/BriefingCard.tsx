"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lumi } from "./Lumi";
import { requestBriefing } from "@/lib/ai-client";
import { glowFromMomentum, mascotFromMomentum } from "@/lib/momentum";
import { profileSummary } from "@/lib/settings";
import { todayYmd } from "@/lib/dates";
import type { Momentum, PlanSlot, Task, UserSettings } from "@/lib/types";

type SlotWithTask = PlanSlot & { task?: Task };

// Versiune în cheie: dacă schimbăm textul/logica briefing-ului, urcăm versiunea
// și cache-urile vechi (ex. cu emoji) sunt ignorate automat la următorul load.
const BRIEFING_KEY = "medieplus:briefing:v2";

// Primește datele ca prop; zona de text are înălțime rezervată, ca răspunsul
// AI să nu împingă pagina când sosește.
export function BriefingCard({
  momentum: m,
  slots,
  settings = null,
}: {
  momentum: Momentum;
  slots: SlotWithTask[];
  settings?: UserSettings | null;
}) {
  const [text, setText] = useState<string>("");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const minuteFocus = slots.reduce((a, s) => a + s.durata, 0);
    const taskIds = new Set(slots.map((s) => s.task_id));
    const celMaiImportant =
      slots.find((s) => s.task?.deadline)?.task?.titlu ?? slots[0]?.task?.titlu;

    // Semnătură: briefing-ul se regenerează DOAR la zi nouă sau când se schimbă
    // ceva relevant (nr. taskuri, stare normal/recovery). Simpla navigare pe
    // home reutilizează textul din cache — fără request-uri repetate.
    const sig = `${todayYmd()}|${taskIds.size}|${m.stare}`;
    try {
      const cached = JSON.parse(localStorage.getItem(BRIEFING_KEY) || "null");
      if (cached && cached.sig === sig && cached.text) {
        setText(cached.text);
        setSpeaking(false);
        return;
      }
    } catch {
      /* localStorage indisponibil — continuăm cu request */
    }

    setSpeaking(true);
    requestBriefing({
      nrTaskuri: taskIds.size,
      minuteFocus,
      stare: m.stare,
      streak: m.streak_zile,
      celMaiImportant,
      profil: profileSummary(settings),
    }).then((t) => {
      if (cancelled) return;
      setText(t);
      try {
        localStorage.setItem(BRIEFING_KEY, JSON.stringify({ sig, text: t }));
      } catch {
        /* ignore */
      }
      // Lasă-l pe Lumi să „vorbească" câteva secunde.
      setTimeout(() => !cancelled && setSpeaking(false), 2600);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.updated_at, m.stare, slots.length, settings?.updated_at]);

  const glow = glowFromMomentum(m.scor_momentum, m.stare);
  const restState = mascotFromMomentum(m.scor_momentum, m.stare);

  return (
    <div className="card-dark relative overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Lumi state={speaking ? "speaking" : restState} glow={glow} size={88} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="label-dark">Lumi zice</div>
          {/* Înălțime rezervată (~3 rânduri) — textul sosit nu mai mișcă layoutul. */}
          <div className="mt-1 min-h-[60px]">
            {text ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm leading-relaxed text-soft-white"
              >
                {text}
              </motion.p>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-40 animate-pulse rounded bg-white/20" />
                <div className="h-3 w-28 animate-pulse rounded bg-white/15" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
