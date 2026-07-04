// Helpere de dată — totul în fus local, format YYYY-MM-DD.

export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function daysBetween(a: string, b: string): number {
  const da = parseYmd(a).getTime();
  const db = parseYmd(b).getTime();
  return Math.round((db - da) / 86400000);
}

export function todayYmd(): string {
  return ymd(new Date());
}

// Numele zilei în română, scurt.
const ZILE = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
export function dayShortRo(s: string): string {
  return ZILE[parseYmd(s).getDay()];
}

const LUNI = [
  "ian", "feb", "mar", "apr", "mai", "iun",
  "iul", "aug", "sep", "oct", "noi", "dec",
];
export function prettyDateRo(s: string): string {
  const d = parseYmd(s);
  return `${d.getDate()} ${LUNI[d.getMonth()]}`;
}

export function hourNow(): number {
  return new Date().getHours();
}
