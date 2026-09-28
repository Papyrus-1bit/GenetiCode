import type { CoatOfArms, DivisionKind, HeraldryDocument, HeraldryLayer, ShieldShape } from "../types";
import { nearestPaletteColor } from "../palette";
import { uid } from "../id";
import { createDocumentFromLegacy, defaultDocument } from "./document";

const DIVISIONS: DivisionKind[] = ["plain", "per_pale", "per_fess", "per_bend", "quarterly", "chevron"];
const SHAPES: ShieldShape[] = ["classic", "heater", "french", "spanish", "banner"];

export function migrateArms(raw: Record<string, unknown>, index: number): CoatOfArms {
  const division = DIVISIONS.includes(raw.division as DivisionKind) ? (raw.division as DivisionKind) : "per_pale";
  const shape = SHAPES.includes(raw.shape as ShieldShape) ? (raw.shape as ShieldShape) : "classic";
  const primary = String(raw.primary_color || raw.primaryColor || "#7b2638");
  const secondary = String(raw.secondary_color || raw.secondaryColor || "#d8b55b");
  const charge = String(raw.charge || "oak");
  const chargeColor = String(raw.charge_color || raw.chargeColor || "#f4ead4");
  const existing = raw.document && typeof raw.document === "object" ? (raw.document as HeraldryDocument) : null;
  const document = existing?.layers
    ? existing
    : createDocumentFromLegacy({ shape, division, primary, secondary, charge, chargeColor });

  return {
    id: String(raw.id || uid("arms") + index),
    name: String(raw.name || "Герб ветви"),
    edge_id: String(raw.edge_id || raw.edgeId || ""),
    shape,
    division,
    primary_color: primary,
    secondary_color: secondary,
    charge,
    charge_color: chargeColor,
    motto: String(raw.motto || ""),
    parent_left_id: String(raw.parent_left_id || raw.parentLeftId || ""),
    parent_right_id: String(raw.parent_right_id || raw.parentRightId || ""),
    document,
  };
}

export function emptyArms(): CoatOfArms {
  const primary = nearestPaletteColor("#7b2638");
  const secondary = nearestPaletteColor("#d8b55b");
  return {
    id: "",
    name: "Герб ветви",
    edge_id: "",
    shape: "classic",
    division: "per_pale",
    primary_color: primary.hex,
    secondary_color: secondary.hex,
    charge: "oak",
    charge_color: "#f4ead4",
    motto: "",
    parent_left_id: "",
    parent_right_id: "",
    document: defaultDocument(primary.id, secondary.id, "per_pale"),
  };
}

export function layerIndex(layers: HeraldryLayer[], id: string): number {
  return layers.findIndex((layer) => layer.id === id);
}
