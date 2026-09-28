export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function samePair(a: string, b: string, x: string, y: string): boolean {
  return (a === x && b === y) || (a === y && b === x);
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function initials(name: string): string {
  const parts = name
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !part.startsWith("("));
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "");
  return letters.join("") || "?";
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}
