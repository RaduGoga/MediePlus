"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import type { MascotState } from "@/lib/types";

// Lumi — o mică scânteie/licurici, sferă moale de lumină mentă pe navy.
// Un SINGUR SVG parametrizat: ochii, gura și glow-ul sunt derivate din stare.
//
// Note de implementare (bug-fix):
// - Transformările pe <g> folosesc transform-box: fill-box + origin central,
//   altfel scale/rotate pivotează din colțul SVG-ului și Lumi „sare".
// - Pulsul glow-ului animă atributul `r`, nu `scale` — fără probleme de origine.
// - Toate gurile sunt curbe Q cu același număr de puncte, ca `d` să se poată
//   interpola lin între stări.
// - `overflow: visible` pe svg, ca blur-ul glow-ului să nu fie tăiat pătrat.

export interface LumiProps {
  state?: MascotState;
  // glow 0..1; dacă lipsește, derivăm din stare.
  glow?: number;
  size?: number;
  className?: string;
}

const MINT = "#6EE7C8";
const NAVY = "#0F172A";

function defaultGlow(state: MascotState): number {
  switch (state) {
    case "focus":
      return 0.9;
    case "momentum":
      return 1;
    case "speaking":
      return 0.8;
    case "recovery":
      return 0.3;
    default:
      return 0.55;
  }
}

// Gurile — toate curbe Q (interpolabile între ele).
const MOUTHS: Record<MascotState, string> = {
  idle: "M54 66 Q60 70 66 66",
  focus: "M54 67 Q60 67 66 67",
  momentum: "M52 64 Q60 73 68 64",
  recovery: "M53 68 Q60 65 67 68",
  speaking: "M55 65 Q60 71 65 65",
};

// Mișcarea corpului (grupul întreg) per stare.
function bodyAnimation(state: MascotState) {
  switch (state) {
    case "focus":
      // Stă cu tine („body double") — puls calm și constant.
      return {
        animate: { scale: [1, 1.03, 1] },
        transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
      };
    case "momentum":
      // Salt scurt + o rotire mică.
      return {
        animate: { y: [0, -12, 0], rotate: [0, -6, 6, 0] },
        transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.8, ease: "easeOut" },
      };
    case "recovery":
      // Mișcare lentă, ușor „obosită".
      return {
        animate: { y: [0, -3, 0] },
        transition: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
      };
    case "speaking":
      // Mic bounce ritmat cât „vorbește".
      return {
        animate: { y: [0, -3, 0] },
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
      };
    default:
      // Idle: plutire lentă sus-jos.
      return {
        animate: { y: [0, -5, 0] },
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      };
  }
}

function glowDuration(state: MascotState): number {
  switch (state) {
    case "momentum":
      return 1.1;
    case "focus":
      return 2.4;
    case "recovery":
      return 6.5;
    case "speaking":
      return 0.5;
    default:
      return 4.5;
  }
}

// Înălțimea ochilor (concentrare / oboseală).
function eyeRy(state: MascotState): number {
  if (state === "recovery") return 1.4;
  if (state === "focus") return 2.4;
  return 3;
}

export function Lumi({ state = "idle", glow, size = 120, className }: LumiProps) {
  const uid = useId().replace(/:/g, "");
  const glowId = `lumi-glow-${uid}`;
  const g = Math.max(0.15, Math.min(1, glow ?? defaultGlow(state)));
  const body = bodyAnimation(state);
  const ry = eyeRy(state);

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ overflow: "visible" }}
      role="img"
      aria-label={`Lumi — stare ${state}`}
    >
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={state === "momentum" ? 8 : 6} />
        </filter>
      </defs>

      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        animate={body.animate}
        transition={body.transition as object}
      >
        {/* Glow difuz — intensitatea = funcție de momentum; pulsează pe `r`. */}
        <motion.circle
          cx={60}
          cy={60}
          r={27}
          fill={MINT}
          filter={`url(#${glowId})`}
          animate={{ opacity: [g * 0.75, g, g * 0.75], r: [27, 30, 27] }}
          transition={{ duration: glowDuration(state), repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Coadă scurtă de lumină. */}
        <path
          d="M60 84 Q56 98 60 108 Q64 98 60 84"
          fill={MINT}
          opacity={0.25 + 0.35 * g}
        />

        {/* Corpul solid. */}
        <circle cx={60} cy={60} r={22} fill={MINT} />

        {/* Ochi — clipit rar prin animarea directă a lui `ry`. */}
        {[52, 68].map((cx) => (
          <motion.ellipse
            key={cx}
            cx={cx}
            cy={56}
            rx={3}
            ry={ry}
            fill={NAVY}
            animate={{ ry: [ry, ry, 0.4, ry] }}
            transition={{
              duration: 4.2,
              times: [0, 0.88, 0.94, 1],
              repeat: Infinity,
              repeatDelay: state === "focus" ? 2 : 0.5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Gura — tranziție lină între stări. */}
        <motion.path
          d={MOUTHS[state]}
          stroke={NAVY}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          initial={false}
          animate={{ d: MOUTHS[state] }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />

        {/* Sclipici la sărbătoare / momentum. */}
        {state === "momentum" && <Sparkles />}
      </motion.g>
    </svg>
  );
}

function Sparkles() {
  const pts = [
    { x: 30, y: 34 },
    { x: 92, y: 40 },
    { x: 86, y: 82 },
    { x: 34, y: 86 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <motion.path
          key={i}
          d={`M${p.x} ${p.y - 4} L${p.x + 1.2} ${p.y - 1.2} L${p.x + 4} ${p.y} L${p.x + 1.2} ${p.y + 1.2} L${p.x} ${p.y + 4} L${p.x - 1.2} ${p.y + 1.2} L${p.x - 4} ${p.y} L${p.x - 1.2} ${p.y - 1.2} Z`}
          fill={MINT}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}
