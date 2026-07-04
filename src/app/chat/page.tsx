"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lumi } from "@/components/Lumi";
import { requestParse } from "@/lib/ai-client";
import { addParsedTasks } from "@/lib/actions";
import { todayYmd, prettyDateRo } from "@/lib/dates";
import type { ParsedTask } from "@/lib/types";

interface Msg {
  id: number;
  rol: "user" | "lumi";
  text: string;
  taskuri?: ParsedTask[];
  confirmat?: boolean;
}

const EXEMPLE = [
  "Am de scris eseul la română și de recapitulat fotosinteza până joi",
  "Mâine test la bio, trebuie să învăț tot capitolul",
  "Am 10 probleme la mate și de citit două capitole de istorie până luni",
];

const TIP_LABEL: Record<string, string> = {
  scriere: "Scriere",
  recapitulare: "Recap",
  citit: "Citit",
  exercitii: "Exerciții",
  proiect: "Proiect",
  memorare: "Memorare",
  altele: "Task",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      rol: "lumi",
      text: "Salut! Spune-mi ce ai de făcut, ca și cum mi-ai povesti. Eu îți fac taskuri și le așez în timpul tău liber.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(1);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    const userMsg: Msg = { id: idRef.current++, rol: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    const tasks = await requestParse(t, todayYmd());
    const lumiMsg: Msg =
      tasks.length > 0
        ? {
            id: idRef.current++,
            rol: "lumi",
            text: `Am înțeles ${tasks.length} ${tasks.length === 1 ? "task" : "taskuri"}. Le adaug în plan?`,
            taskuri: tasks,
          }
        : {
            id: idRef.current++,
            rol: "lumi",
            text: "Hmm, n-am prins niciun task clar. Încearcă ceva de genul „de scris eseul la română până joi”.",
          };
    setMessages((m) => [...m, lumiMsg]);
    setBusy(false);
  }

  async function confirm(msgId: number, tasks: ParsedTask[]) {
    const n = await addParsedTasks(tasks);
    setMessages((m) =>
      m.map((x) => (x.id === msgId ? { ...x, confirmat: true } : x)).concat({
        id: idRef.current++,
        rol: "lumi",
        text: `Gata — ${n} ${n === 1 ? "task adăugat" : "taskuri adăugate"} și așezate în sesiuni de focus. Le vezi în Plan.`,
      })
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col">
      <header className="mb-3 flex items-center gap-3">
        <Lumi state={busy ? "speaking" : "idle"} size={52} />
        <h1 className="font-display text-xl font-extrabold text-navy">Co-pilot</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.rol === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.rol === "user"
                    ? "rounded-br-md bg-navy text-soft-white"
                    : "rounded-bl-md bg-white text-navy shadow-card"
                }`}
              >
                <p>{m.text}</p>

                {m.taskuri && (
                  <div className="mt-3 space-y-2">
                    {m.taskuri.map((t, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-2.5">
                        <div className="text-sm font-semibold text-navy">{t.titlu}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate">
                          <span className="chip">{TIP_LABEL[t.tip] ?? t.tip}</span>
                          <span>~{t.durata_min} min</span>
                          {t.materie && <span>{t.materie}</span>}
                          {t.deadline && <span>⏳ {prettyDateRo(t.deadline)}</span>}
                        </div>
                      </div>
                    ))}
                    {!m.confirmat ? (
                      <button className="btn-primary w-full" onClick={() => confirm(m.id, m.taskuri!)}>
                        Adaugă în plan
                      </button>
                    ) : (
                      <div className="text-center text-xs font-semibold text-mint">✓ Adăugate</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <p className="animate-pulse pl-1 text-sm text-slate">Lumi se gândește…</p>
        )}

        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <div className="label">De exemplu</div>
            {EXEMPLE.map((ex) => (
              <button
                key={ex}
                onClick={() => send(ex)}
                className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-navy transition hover:border-mint"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-20 flex gap-2 bg-soft-white pt-2">
        <input
          className="input"
          placeholder="Spune-i ce ai de făcut…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button className="btn-primary shrink-0" onClick={() => send(input)} disabled={busy || !input.trim()}>
          Trimite
        </button>
      </div>
    </main>
  );
}
