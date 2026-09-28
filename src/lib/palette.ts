import { hexToOklab, oklabDistance } from "./oklab";

export interface PaletteColor {
  id: string;
  name: string;
  family: string;
  hex: string;
}

const FAMILIES: { family: string; label: string; hexes: string[] }[] = [
  {
    family: "rose",
    label: "Rose",
    hexes: ["#FECDD3", "#FDA4AF", "#FB7185", "#F43F5E", "#E11D48", "#BE123C", "#9F1239", "#881337"],
  },
  {
    family: "orange",
    label: "Orange",
    hexes: ["#FED7AA", "#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C", "#9A3412", "#7C2D12"],
  },
  {
    family: "amber",
    label: "Amber",
    hexes: ["#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F"],
  },
  {
    family: "lime",
    label: "Lime",
    hexes: ["#D9F99D", "#BEF264", "#A3E635", "#84CC16", "#65A30D", "#4D7C0F", "#3F6212", "#365314"],
  },
  {
    family: "emerald",
    label: "Emerald",
    hexes: ["#A7F3D0", "#6EE7B7", "#34D399", "#10B981", "#059669", "#047857", "#065F46", "#064E3B"],
  },
  {
    family: "cyan",
    label: "Cyan",
    hexes: ["#A5F3FC", "#67E8F9", "#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"],
  },
  {
    family: "blue",
    label: "Blue",
    hexes: ["#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A"],
  },
  {
    family: "violet",
    label: "Violet",
    hexes: ["#DDD6FE", "#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95"],
  },
];

const STEPS = ["200", "300", "400", "500", "600", "700", "800", "900"];

export const PALETTE: PaletteColor[] = FAMILIES.flatMap(({ family, label, hexes }) =>
  hexes.map((hex, index) => ({
    id: `${family}-${STEPS[index]}`,
    name: `${label} ${STEPS[index]}`,
    family,
    hex,
  })),
);

export const PALETTE_BY_ID = Object.fromEntries(PALETTE.map((color) => [color.id, color]));

export const DEFAULT_GROUP_COLOR_ID = "rose-800";

export function colorById(id: string | undefined | null): PaletteColor {
  return (id && PALETTE_BY_ID[id]) || PALETTE_BY_ID[DEFAULT_GROUP_COLOR_ID];
}

export function nearestPaletteColor(hex: string): PaletteColor {
  const lab = hexToOklab(hex);
  if (!lab) return colorById(DEFAULT_GROUP_COLOR_ID);
  let best = PALETTE[0];
  let bestDistance = Infinity;
  for (const color of PALETTE) {
    const other = hexToOklab(color.hex);
    if (!other) continue;
    const distance = oklabDistance(lab, other);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }
  return best;
}
