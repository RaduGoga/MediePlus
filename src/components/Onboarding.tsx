"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lumi } from "./Lumi";
import { useSettings } from "@/hooks/useData";
import { saveSettings } from "@/lib/settings";
import { replan } from "@/lib/planner";
import type { NivelScolar, ProfilLiceu, PreferintaOra } from "@/lib/types";

// Quiz de onboarding — apare la prima intrare (sau când profilul e redeschis).
// Răspunsurile personalizează planificarea (orele sesiunilor) și recomandările
// AI (briefing, recall). Totul offline, în Dexie.

const NIVELE: { v: NivelScolar; label: string; icon: React.ReactNode }[] = [
  { v: "scoala", label: "Școală generală", icon: <BackpackIcon /> },
  { v: "liceu", label: "Liceu", icon: <BookIcon /> },
  { v: "facultate", label: "Facultate", icon: <CapIcon /> },
];

const CLASE: Record<NivelScolar, string[]> = {
  scoala: ["a V-a", "a VI-a", "a VII-a", "a VIII-a"],
  liceu: ["a IX-a", "a X-a", "a XI-a", "a XII-a"],
  facultate: ["Anul 1", "Anul 2", "Anul 3+"],
};

const PROFILE: { v: ProfilLiceu; label: string }[] = [
  { v: "uman", label: "Uman" },
  { v: "real", label: "Real" },
  { v: "stiinte", label: "Științe ale naturii" },
  { v: "altul", label: "Alt profil" },
];

const PREFERINTE: { v: PreferintaOra; label: string; icon: React.ReactNode }[] = [
  { v: "dimineata", label: "Dimineața", icon: <SunriseIcon /> },
  { v: "dupa_amiaza", label: "După-amiaza", icon: <SunIcon /> },
  { v: "seara", label: "Seara", icon: <MoonIcon /> },
];

type Step = "intro" | "nivel" | "clasa" | "profil" | "preferinta" | "gata";

export function Onboarding() {
  const settings = useSettings();
  // undefined = se încarcă (nu afișăm nimic); onboarded = nu mai e nevoie.
  if (settings === undefined || settings?.onboarded) return null;
  return (
    <Quiz
      initial={{
        nivel: settings?.nivel,
        clasa: settings?.clasa,
        profil: settings?.profil,
        preferinta: settings?.preferinta_ora,
      }}
    />
  );
}

function Quiz({
  initial,
}: {
  initial: {
    nivel?: NivelScolar;
    clasa?: string;
    profil?: ProfilLiceu;
    preferinta?: PreferintaOra;
  };
}) {
  const [step, setStep] = useState<Step>("intro");
  const [nivel, setNivel] = useState<NivelScolar | undefined>(initial.nivel);
  const [clasa, setClasa] = useState<string | undefined>(initial.clasa);
  const [profil, setProfil] = useState<ProfilLiceu | undefined>(initial.profil);
  const [preferinta, setPreferinta] = useState<PreferintaOra | undefined>(
    initial.preferinta
  );
  const [saving, setSaving] = useState(false);

  const steps: Step[] = ["intro", "nivel", "clasa", "profil", "preferinta", "gata"];
  const visibleSteps = steps.filter((s) => s !== "profil" || nivel === "liceu");
  const idx = visibleSteps.indexOf(step);

  function next() {
    setStep(visibleSteps[Math.min(idx + 1, visibleSteps.length - 1)]);
  }
  function back() {
    if (idx > 0) setStep(visibleSteps[idx - 1]);
  }

  async function finish() {
    if (!nivel || !preferinta || saving) return;
    setSaving(true);
    try {
      await saveSettings({
        nivel,
        clasa,
        profil: nivel === "liceu" ? profil : undefined,
        preferinta_ora: preferinta,
        onboarded: true,
      });
      // Planul se re-așază imediat pe preferințele noi.
      await replan();
      // Overlay-ul dispare singur: useSettings vede onboarded=true.
    } finally {
      setSaving(false);
    }
  }

  const lumiState = step === "gata" ? "momentum" : "speaking";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-10">
        {/* Lumi + progres */}
        <div className="flex flex-col items-center gap-3">
          <Lumi state={lumiState} size={110} />
          <div className="flex gap-1.5">
            {visibleSteps.slice(1).map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < idx ? "w-6 bg-mint" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8 flex flex-1 flex-col"
          >
            {step === "intro" && (
              <StepShell
                title="Salut! Eu sunt Lumi."
                subtitle="Înainte să-ți fac planul, hai să te cunosc puțin."
              >
                <button className="btn-primary w-full" onClick={next}>
                  Hai să începem
                </button>
              </StepShell>
            )}

            {step === "nivel" && (
              <StepShell title="Unde înveți?">
                {NIVELE.map((n) => (
                  <ChoiceButton
                    key={n.v}
                    selected={nivel === n.v}
                    onClick={() => {
                      setNivel(n.v);
                      // Clasa/profilul vechi nu se potrivesc cu alt nivel.
                      if (nivel !== n.v) {
                        setClasa(undefined);
                        setProfil(undefined);
                      }
                      next();
                    }}
                  >
                    <span className="mr-3 inline-flex align-middle opacity-80">{n.icon}</span>
                    {n.label}
                  </ChoiceButton>
                ))}
              </StepShell>
            )}

            {step === "clasa" && nivel && (
              <StepShell
                title={nivel === "facultate" ? "În ce an ești?" : "În ce clasă ești?"}
              >
                {CLASE[nivel].map((c) => (
                  <ChoiceButton
                    key={c}
                    selected={clasa === c}
                    onClick={() => {
                      setClasa(c);
                      next();
                    }}
                  >
                    {c}
                  </ChoiceButton>
                ))}
              </StepShell>
            )}

            {step === "profil" && (
              <StepShell title="La ce profil ești?">
                {PROFILE.map((p) => (
                  <ChoiceButton
                    key={p.v}
                    selected={profil === p.v}
                    onClick={() => {
                      setProfil(p.v);
                      next();
                    }}
                  >
                    {p.label}
                  </ChoiceButton>
                ))}
              </StepShell>
            )}

            {step === "preferinta" && (
              <StepShell
                title="Când înveți cel mai bine?"
                subtitle="Îți pun sesiunile importante în fereastra asta."
              >
                {PREFERINTE.map((p) => (
                  <ChoiceButton
                    key={p.v}
                    selected={preferinta === p.v}
                    onClick={() => {
                      setPreferinta(p.v);
                      next();
                    }}
                  >
                    <span className="mr-3 inline-flex align-middle opacity-80">{p.icon}</span>
                    {p.label}
                  </ChoiceButton>
                ))}
              </StepShell>
            )}

            {step === "gata" && (
              <StepShell
                title="Gata!"
                subtitle="De acum planul, sesiunile și sfaturile mele sunt pe stilul tău. Le poți schimba oricând din Plan."
              >
                <button
                  className="btn-primary w-full"
                  onClick={finish}
                  disabled={saving || !nivel || !preferinta}
                >
                  {saving ? "Pregătesc planul…" : "Arată-mi planul meu"}
                </button>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {idx > 0 && step !== "gata" && (
          <button
            onClick={back}
            className="mt-6 self-center text-sm text-white/50 transition hover:text-white"
          >
            ← Înapoi
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-center font-display text-2xl font-extrabold text-soft-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-center text-sm leading-relaxed text-white/60">
          {subtitle}
        </p>
      )}
      <div className="mt-8 space-y-3">{children}</div>
    </div>
  );
}

// Iconuri minimaliste, stroke pe currentColor — albe pe navy, navy pe selecție.
const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function BackpackIcon() {
  return (
    <svg {...iconProps}>
      <path d="M8 6V5a4 4 0 0 1 8 0v1" />
      <rect x="5" y="6" width="14" height="15" rx="4" />
      <path d="M5 13h14M9 13v3M15 13v3" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 6.5C10.5 5 8.5 4.5 5.5 4.5c-.8 0-1.5.6-1.5 1.4v11c0 .8.7 1.4 1.5 1.4 3 0 5 .5 6.5 2 1.5-1.5 3.5-2 6.5-2 .8 0 1.5-.6 1.5-1.4v-11c0-.8-.7-1.4-1.5-1.4-3 0-5 .5-6.5 2Z" />
      <path d="M12 6.5v13.8" />
    </svg>
  );
}
function CapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
      <path d="M6.5 12v4.2c0 1 2.5 2.3 5.5 2.3s5.5-1.3 5.5-2.3V12" />
      <path d="M22 9.5V15" />
    </svg>
  );
}
function SunriseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v4M5.2 7.2l1.4 1.4M18.8 7.2l-1.4 1.4" />
      <path d="M7 15a5 5 0 0 1 10 0" />
      <path d="M3 15h2M19 15h2M3 19h18" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" />
    </svg>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl2 border px-5 py-4 text-left text-base font-semibold transition-colors duration-150 ${
        selected
          ? "border-mint bg-mint text-navy"
          : "border-white/15 bg-white/5 text-soft-white hover:border-mint/60 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
