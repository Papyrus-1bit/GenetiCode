export interface Oklab {
  L: number;
  a: number;
  b: number;
}

function srgbToLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const s = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace("#", "");
  const normal =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normal)) return null;
  return {
    r: parseInt(normal.slice(0, 2), 16),
    g: parseInt(normal.slice(2, 4), 16),
    b: parseInt(normal.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function rgbToOklab(r: number, g: number, b: number): Oklab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabToRgb(lab: Oklab): { r: number; g: number; b: number } {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

export function hexToOklab(hex: string): Oklab | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToOklab(rgb.r, rgb.g, rgb.b);
}

export function oklabDistance(a: Oklab, b: Oklab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function mixOklab(hexA: string, hexB: string, t = 0.5): string {
  const a = hexToOklab(hexA);
  const b = hexToOklab(hexB);
  if (!a && !b) return hexA || hexB;
  if (!a) return hexB;
  if (!b) return hexA;
  const mixed: Oklab = {
    L: a.L + (b.L - a.L) * t,
    a: a.a + (b.a - a.a) * t,
    b: a.b + (b.b - a.b) * t,
  };
  const rgb = oklabToRgb(mixed);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}
