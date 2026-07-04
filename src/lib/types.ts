// Model de date MediePlus+.
// Schema veche (note / medii) a dispărut complet — aici nu există nicio notă.

export type TaskType =
  | "scriere"
  | "recapitulare"
  | "citit"
  | "exercitii"
  | "proiect"
  | "memorare"
  | "altele";

export type TaskStatus = "de_facut" | "in_lucru" | "finalizat";
export type TaskSource = "chat" | "manual";

export interface Task {
  id?: number;
  titlu: string;
  tip: TaskType;
  durata_min: number; // durată totală estimată
  deadline?: string; // ISO date (YYYY-MM-DD)
  materie?: string;
  status: TaskStatus;
  sursa: TaskSource;
  creat_la: number; // epoch ms
}

export interface Session {
  id?: number;
  task_id?: number;
  start: number; // epoch ms
  durata_reala: number; // minute
  micro_obiectiv: string;
  finalizata: boolean;
}

export interface PlanSlot {
  id?: number;
  task_id: number;
  data: string; // YYYY-MM-DD
  ora_start: string; // HH:MM
  durata: number; // minute
  replanificat: boolean;
  finalizat: boolean;
}

export interface RecallItem {
  id?: number;
  session_id?: number;
  task_id?: number;
  intrebare: string;
  raspuns?: string;
  reluare_la: string; // YYYY-MM-DD — repetiție spațiată ușoară
  rezolvat: boolean;
  creat_la: number;
}

export type MomentumState = "normal" | "recovery";

export interface Momentum {
  user_id: string; // "local" pentru utilizatorul offline
  streak_zile: number;
  scor_momentum: number; // 0..100
  stare: MomentumState;
  ultima_zi_focus?: string; // YYYY-MM-DD
  updated_at: number;
}

export interface ActivityDay {
  // cheie compusă: `${user_id}|${data}`
  key: string;
  user_id: string;
  data: string; // YYYY-MM-DD
  minute_focus: number;
}

export type InsightType = "tipar_orar" | "tipar_ritm" | "incurajare" | "general";

export interface Insight {
  id?: number;
  user_id: string;
  text: string;
  tip: InsightType;
  generat_la: number;
}

export type MascotState =
  | "idle"
  | "focus"
  | "momentum"
  | "recovery"
  | "speaking";

export interface MascotStateRow {
  user_id: string;
  stare_curenta: MascotState;
  glow_level: number; // 0..1 derivat din momentum
}

// Profilul elevului — completat la primul quiz de onboarding. Influențează
// planificarea (orele sesiunilor) și recomandările (briefing, recall).
export type NivelScolar = "scoala" | "liceu" | "facultate";
export type ProfilLiceu = "uman" | "real" | "stiinte" | "altul";
export type PreferintaOra = "dimineata" | "dupa_amiaza" | "seara";

export interface UserSettings {
  user_id: string;
  nivel: NivelScolar;
  clasa?: string; // ex: "a XII-a", "Anul 2"
  profil?: ProfilLiceu; // doar pentru liceu
  preferinta_ora: PreferintaOra;
  onboarded: boolean;
  updated_at: number;
}

// Contractul AI pentru parser.
export interface ParsedTask {
  titlu: string;
  tip: string;
  durata_min: number;
  deadline?: string;
  materie?: string;
}
