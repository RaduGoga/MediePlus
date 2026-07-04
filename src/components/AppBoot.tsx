"use client";

import { useEffect } from "react";
import { ensureSeed } from "@/lib/db";
import { decayIfNeeded } from "@/lib/momentum";
import { replan } from "@/lib/planner";
import { generateInsights } from "@/lib/insights";

// Inițializare la pornire: seed pentru singleton-uri, decădere blândă de momentum
// dacă au trecut zile, și re-planificare (planul viu se re-aranjează singur).
export function AppBoot() {
  useEffect(() => {
    (async () => {
      try {
        await ensureSeed();
        await decayIfNeeded();
        await replan();
        await generateInsights();
      } catch {
        /* offline-first: ignorăm erorile de boot */
      }
    })();
  }, []);
  return null;
}
