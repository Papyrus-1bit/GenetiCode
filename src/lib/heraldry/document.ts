import type { DivisionKind, HeraldryDocument, HeraldryLayer, ShieldShape } from "../types";
import { colorById, nearestPaletteColor } from "../palette";
import { uid } from "../id";

export const DOC_WIDTH = 1000;
export const DOC_HEIGHT = 1200;

export const SHIELD_PATHS: Record<ShieldShape, string> = {
  classic: "M114 91 H886 V605 C886 864 723 1018 500 1118 C277 1018 114 864 114 605 Z",
  heater: "M140 80 H860 V560 C860 880 680 1040 500 1140 C320 1040 140 880 140 560 Z",
  french: "M120 90 H880 V980 C700 1120 500 1160 500 1160 C500 1160 300 1120 120 980 Z",
  spanish: "M130 90 H870 V700 C870 980 720 1120 500 1145 C280 1120 130 980 130 700 Z",
  banner: "M180 70 H820 V1120 H180 Z",
};

export function defaultDocument(
  fieldColorId = "rose-800",
  divisionColorId = "amber-400",
  division: DivisionKind = "per_pale",
  shape: ShieldShape = "classic",
): HeraldryDocument {
  const field = colorById(fieldColorId);
  const second = colorById(divisionColorId);
  return {
    width: DOC_WIDTH,
    height: DOC_HEIGHT,
    shield: { shape, locked: true },
    field: { colorId: field.id, color: field.hex, locked: true },
    division: { kind: division, colorId: second.id, color: second.hex, locked: true },
    layers: [],
  };
}

export function createAssetLayer(
  name: string,
  assetId: string,
  extra?: Partial<HeraldryLayer>,
): HeraldryLayer {
  return {
    id: uid("layer"),
    type: extra?.type || "asset",
    name,
    assetId,
    x: extra?.x ?? 320,
    y: extra?.y ?? 380,
    width: extra?.width ?? 360,
    height: extra?.height ?? 360,
    rotation: extra?.rotation ?? 0,
    scaleX: extra?.scaleX ?? 1,
    scaleY: extra?.scaleY ?? 1,
    opacity: extra?.opacity ?? 1,
    visible: extra?.visible ?? true,
    locked: extra?.locked ?? false,
    svgMarkup: extra?.svgMarkup,
    imageData: extra?.imageData,
    color: extra?.color ?? "#F4EAD4",
    colorId: extra?.colorId,
  };
}

export function createDocumentFromLegacy(input: {
  shape: ShieldShape;
  division: DivisionKind;
  primary: string;
  secondary: string;
  charge: string;
  chargeColor: string;
}): HeraldryDocument {
  const field = nearestPaletteColor(input.primary);
  const second = nearestPaletteColor(input.secondary);
  const document = defaultDocument(field.id, second.id, input.division === "plain" ? "plain" : input.division, input.shape);
  document.layers = [
    createAssetLayer(chargeLabel(input.charge), input.charge, {
      color: input.chargeColor,
      x: 310,
      y: 390,
      width: 380,
      height: 380,
    }),
  ];
  return document;
}

function chargeLabel(charge: string): string {
  const labels: Record<string, string> = {
    oak: "Дуб",
    star: "Звезда",
    tower: "Башня",
    key: "Ключ",
    bird: "Птица",
    crown: "Корона",
    wheat: "Колос",
  };
  return labels[charge] || "Знак";
}

export function syncCoatFromDocument(document: HeraldryDocument): Pick<
  { primary_color: string; secondary_color: string; division: DivisionKind; shape: ShieldShape; charge: string; charge_color: string },
  "primary_color" | "secondary_color" | "division" | "shape" | "charge" | "charge_color"
> {
  const firstAsset = document.layers.find((layer) => layer.type === "asset" || layer.type === "image");
  return {
    primary_color: document.field.color,
    secondary_color: document.division.color,
    division: document.division.kind,
    shape: document.shield.shape,
    charge: firstAsset?.assetId || "oak",
    charge_color: firstAsset?.color || "#F4EAD4",
  };
}
