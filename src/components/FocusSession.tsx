"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Lumi } from "./Lumi";
import { getDB } from "@/lib/db";
import { startSession, completeSession, addRecall } from "@/lib/actions";
import { requestRecall } from "@/lib/ai-client";
import { profileSummary } from "@/lib/settings";
import { useSettings } from "@/hooks/useData";
import type { Task } from "@/lib/types";
import { SESSION_MIN } from "@/lib/planner";

type Phase = "setup" | "running" | "recall" | "done";
const DURATE = [15, 25, 45];

export function FocusSession() {
  const router = useRouter();
  const params = useSearchParams();
  const taskParam = params.get("task");
  const taskId = taskParam ? Number(taskParam) : undefined;

  const [phase, setPhase] = useState<Phase>("setup");
  const [obiectiv, setObiectiv] = useState("");
  const [durataMin, setDurataMin] = useState(SESSION_MIN);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_MIN * 60);
  const [paused, setPaused] = useState(false);
  const sessionIdRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);

  // recall state
  const [intrebare, setIntrebare] = useState("");
  const [reluareZile, setReluareZile] = useState(3);
  const [raspuns, setRaspuns] = useState("");
  const [recallLoading, setRecallLoading] = useState(false);

  // Taskurile de azi disponibile, dacă nu vine unul din URL.
  const task = useLiveQuery(
    async () => (taskId ? await getDB().tasks.get(taskId) : undefined),
    [taskId]
  );
  const taskuri = useLiveQuery(
    async () =>
      (await getDB().tasks.where("status").notEqual("finalizat").toArray()).slice(0, 8),
    []
  );

  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const effectiveTask = task ?? selectedTask;
  const settings = useSettings();

  // Cronometru.
  useEffect(() => {
    if (phase !== "running" || paused) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused]);

  async function begin() {
    const id = await startSession(effectiveTask?.id, obiectiv || "Sesiune de focus");
    sessionIdRef.current = id;
    startTsRef.current = Date.now();
    setSecondsLeft(durataMin * 60);
    setPhase("running");
  }

  async function finish() {
    if (phase === "recall" || phase === "done") return;
    const elapsedMin = Math.max(
      1,
      Math.round((Date.now() - startTsRef.current) / 60000)
    );
    if (sessionIdRef.current) {
      await completeSession(sessionIdRef.current, elapsedMin);
    }
    // Pasul de recall (diferențiatorul educațional).
    setPhase("recall");
    setRecallLoading(true);
    const r = await requestRecall(
      effectiveTask?.titlu ?? obiectiv ?? "sesiunea ta",
      effectiveTask?.materie,
      profileSummary(settings ?? null)
    );
    setIntrebare(r.intrebare);
    setReluareZile(r.reluare_zile);
    setRecallLoading(false);
  }

  async function saveRecall() {
    await addRecall(
      sessionIdRef.current ?? undefined,
      effectiveTask?.id,
      intrebare,
      reluareZile
    );
    setPhase("done");
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = phase === "running" ? 1 - secondsLeft / (durataMin * 60) : 0;

  // ——— SETUP ———
  if (phase === "setup") {
    return (
      <main className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-navy">Focus</h1>
        </header>

        <div className="flex justify-center py-2">
          <Lumi state="idle" size={120} />
        </div>

        {!effectiveTask && taskuri && taskuri.length > 0 && (
          <div>
            <span className="label">Pe ce lucrezi?</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {taskuri.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selectedTask?.id === t.id ? "bg-navy text-soft-white" : "bg-slate-100 text-slate hover:bg-slate-200"
                  }`}
                >
                  {t.titlu}
                </button>
              ))}
            </div>
          </div>
        )}

        {effectiveTask && (
          <div className="card">
            <span className="label">Lucrezi la</span>
            <div className="mt-1 font-semibold text-navy">{effectiveTask.titlu}</div>
          </div>
        )}

        <div>
          <span className="label">Ce vrei să termini acum?</span>
          <input
            className="input mt-2"
            placeholder="ex: Scriu introducerea și primul paragraf"
            value={obiectiv}
            onChange={(e) => setObiectiv(e.target.value)}
          />
        </div>

        <div>
          <span className="label">Cât timp?</span>
          <div className="mt-2 flex gap-2">
            {DURATE.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDurataMin(d);
                  setSecondsLeft(d * 60);
                }}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                  durataMin === d ? "bg-mint text-navy shadow-glow" : "bg-slate-100 text-slate"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <button className="btn-dark w-full" onClick={begin} disabled={!obiectiv.trim()}>
          Începe focusul
        </button>
      </main>
    );
  }

  // ——— RUNNING ———
  if (phase === "running") {
    return (
      <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-8 text-center">
        <Lumi state="focus" size={160} />

        <div>
          <div className="font-display text-6xl font-extrabold tabular-nums text-navy">
            {mm}:{ss}
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate">{obiectiv}</p>
        </div>

        {/* Bară de progres discretă — avansează continuu, fără sacadări. */}
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-mint"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => setPaused((p) => !p)}>
            {paused ? "Continuă" : "Pauză"}
          </button>
          <button className="btn-primary" onClick={finish}>
            Am terminat
          </button>
        </div>
      </main>
    );
  }

  // ——— RECALL ———
  if (phase === "recall") {
    return (
      <main className="space-y-5">
        <div className="flex justify-center py-2">
          <Lumi state="speaking" size={110} />
        </div>
        <div className="card-dark">
          <span className="label-dark">Ca să nu uiți</span>
          {recallLoading ? (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-48 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-32 animate-pulse rounded bg-white/15" />
            </div>
          ) : (
            <p className="mt-2 text-base font-medium leading-relaxed text-soft-white">
              {intrebare}
            </p>
          )}
        </div>

        <textarea
          className="input min-h-[96px] resize-none"
          placeholder="Răspunde scurt, cu cuvintele tale…"
          value={raspuns}
          onChange={(e) => setRaspuns(e.target.value)}
        />
        <p className="text-xs text-slate">
          Te mai întreb o dată peste {reluareZile} zile, ca să-ți rămână în minte.
        </p>

        <button className="btn-primary w-full" onClick={saveRecall} disabled={recallLoading}>
          Gata
        </button>
      </main>
    );
  }

  // ——— DONE ———
  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-6 text-center">
      <Lumi state="momentum" size={150} />
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy">Sesiune închisă!</h1>
        <p className="mt-2 max-w-xs text-sm text-slate">
          Momentum-ul a crescut. Ne vedem la următoarea.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button className="btn-dark w-full" onClick={() => router.push("/")}>
          Înapoi acasă
        </button>
        <button
          className="btn-ghost w-full"
          onClick={() => {
            // Reset pentru încă o sesiune.
            sessionIdRef.current = null;
            setObiectiv("");
            setRaspuns("");
            setSelectedTask(undefined);
            setSecondsLeft(durataMin * 60);
            setPaused(false);
            setPhase("setup");
          }}
        >
          Încă o sesiune
        </button>
      </div>
    </main>
  );
}
