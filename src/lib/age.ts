import type { Person } from "./types";

interface ParsedDate {
  day?: number;
  month?: number;
  year: number;
  approximate: boolean;
}

function parseDate(value: string): ParsedDate | null {
  const full = value.match(/(?:^|\D)(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\D|$)/);
  if (full) {
    return { day: +full[1], month: +full[2], year: +full[3], approximate: false };
  }
  const year = value.match(/(?:^|\D)((?:18|19|20)\d{2})(?:\D|$)/);
  return year ? { year: +year[1], approximate: true } : null;
}

function yearsBetween(from: ParsedDate, to: ParsedDate): number {
  let n = to.year - from.year;
  if (from.month && to.month && (to.month < from.month || (to.month === from.month && (to.day || 1) < (from.day || 1)))) {
    n -= 1;
  }
  return Math.max(0, n);
}

export function isDeceased(person: Person): boolean {
  return Boolean(person.is_deceased || person.died.trim() || person.isPlaceholder === false && person.died);
}

export function formatAge(person: Person, now = new Date()): string {
  if (person.isPlaceholder) return "";
  const born = parseDate(person.born);
  if (!born) return "Возраст неизвестен";
  const dead = isDeceased(person);
  const end = dead
    ? parseDate(person.died)
    : { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), approximate: false };
  if (!end) return "Возраст неизвестен";
  const age = yearsBetween(born, end);
  const approx = born.approximate || end.approximate;
  const mod10 = age % 10;
  const word = age % 100 >= 11 && age % 100 <= 14 ? "лет" : mod10 === 1 ? "год" : mod10 >= 2 && mod10 <= 4 ? "года" : "лет";
  return `${approx ? "≈ " : ""}${age} ${word}${dead ? " на момент смерти" : ""}`;
}

export function resolveGender(person: Person): Person["gender"] {
  if (person.gender !== "unknown") return person.gender;
  if (/(?:вна|чна|ова|ева|ина|ская)(?:\s|$)/i.test(person.name)) return "female";
  if (/(?:ич|ов|ев|ин|ский)(?:\s|$)/i.test(person.name)) return "male";
  return "unknown";
}

export function gendered(person: Person, male: string, female: string, fallback: string): string {
  const gender = resolveGender(person);
  if (gender === "male") return male;
  if (gender === "female") return female;
  return fallback;
}

export function generationsLabel(count: number): string {
  const mod10 = count % 10;
  const word =
    count % 100 >= 11 && count % 100 <= 14 ? "ПОКОЛЕНИЙ" : mod10 === 1 ? "ПОКОЛЕНИЕ" : mod10 >= 2 && mod10 <= 4 ? "ПОКОЛЕНИЯ" : "ПОКОЛЕНИЙ";
  return word;
}
