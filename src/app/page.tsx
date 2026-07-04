"use client";

import Link from "next/link";
import { BriefingCard } from "@/components/BriefingCard";
import { MomentumCard } from "@/components/MomentumCard";
import { RecallDueCard } from "@/components/RecallDueCard";
import { PlanList } from "@/components/PlanList";
import { InsightsCard } from "@/components/InsightsCard";
import {
  useTodaySlots,
  useMomentum,
  useDueRecall,
  useInsights,
  useSettings,
} from "@/hooks/useData";

export default function HomePage() {
  const slots = useTodaySlots();
  const momentum = useMomentum();
  const due = useDueRecall();
  const insights = useInsights();
  const settings = useSettings();

  // Așteptăm TOATE datele înainte să arătăm ceva — altfel cardurile apar pe
  // rând și împing pagina (jitter). Apoi totul intră cu un singur fade.
  const ready =
    slots !== undefined &&
    momentum !== undefined &&
    due !== undefined &&
    insights !== undefined &&
    settings !== undefined;

  if (!ready) return null;

  const ramase = slots.filter((s) => !s.finalizat).length;

  return (
    <main className="page-fade space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy">MediePlus+</h1>
      </header>

      <BriefingCard momentum={momentum} slots={slots} settings={settings} />

      <RecallDueCard due={due} />

      <MomentumCard momentum={momentum} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Planul de azi</h2>
          <Link href="/plan" className="text-xs font-semibold text-slate hover:text-navy">
            Vezi tot →
          </Link>
        </div>
        <PlanList
          slots={slots}
          emptyText="Nimic planificat azi. Spune-i co-pilotului ce ai de făcut."
        />
        {ramase > 0 && (
          <Link href="/focus" className="btn-primary mt-3 w-full">
            Pornește o sesiune de focus
          </Link>
        )}
        {slots.length === 0 && (
          <Link href="/chat" className="btn-dark mt-3 w-full">
            Vorbește cu co-pilotul
          </Link>
        )}
      </section>

      <InsightsCard insights={insights} />
    </main>
  );
}
