import type { CardMode, GenealogyState, Person } from "./types";
import { CARD_SIZE, NEUTRAL_LINE } from "./types";
import { mixOklab } from "./oklab";
import { colorById } from "./palette";
import { listParentPairs, parentsOf } from "./family";

export interface Point {
  x: number;
  y: number;
}

export interface FamilyPath {
  id: string;
  d: string;
  stroke: string;
  stroke2?: string;
  mixed?: string;
  kind: "pair" | "trunk" | "rail" | "drop" | "preview";
  pairId?: string;
}

export function cardRect(person: Person, mode: CardMode) {
  const size = CARD_SIZE[mode];
  return { x: person.x, y: person.y, w: size.w, h: size.h, cx: person.x + size.w / 2, cy: person.y + size.h / 2 };
}

export function connectorPoint(person: Person, side: "top" | "right" | "bottom" | "left", mode: CardMode): Point {
  const box = cardRect(person, mode);
  if (side === "top") return { x: box.cx, y: box.y };
  if (side === "right") return { x: box.x + box.w, y: box.cy };
  if (side === "bottom") return { x: box.cx, y: box.y + box.h };
  return { x: box.x, y: box.cy };
}

export function primaryColorOf(state: GenealogyState, person: Person | undefined): string | null {
  if (!person || person.isPlaceholder) return null;
  const groups = state.groups.filter((group) => group.member_ids.includes(person.id));
  if (!groups.length) return null;
  const primary = groups.find((group) => group.id === person.primaryGroupId) || groups[0];
  return colorById(primary.groupColorId).hex;
}

export function pairColors(state: GenealogyState, a: Person, b: Person): { a: string; b: string; mixed: string } {
  const colorA = primaryColorOf(state, a);
  const colorB = primaryColorOf(state, b);
  if (a.isPlaceholder && colorB) return { a: colorB, b: colorB, mixed: colorB };
  if (b.isPlaceholder && colorA) return { a: colorA, b: colorA, mixed: colorA };
  if (colorA && colorB) {
    if (colorA.toLowerCase() === colorB.toLowerCase()) return { a: colorA, b: colorB, mixed: colorA };
    return { a: colorA, b: colorB, mixed: mixOklab(colorA, colorB, 0.5) };
  }
  if (colorA) return { a: colorA, b: colorA, mixed: colorA };
  if (colorB) return { a: colorB, b: colorB, mixed: colorB };
  return { a: NEUTRAL_LINE, b: NEUTRAL_LINE, mixed: NEUTRAL_LINE };
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function buildFamilyPaths(state: GenealogyState, mode: CardMode): FamilyPath[] {
  const paths: FamilyPath[] = [];
  const coveredChildren = new Set<string>();
  const pairs = listParentPairs(state);

  for (const pair of pairs) {
    const boxA = cardRect(pair.a, mode);
    const boxB = cardRect(pair.b, mode);
    const left = boxA.cx <= boxB.cx ? boxA : boxB;
    const right = boxA.cx <= boxB.cx ? boxB : boxA;
    const pairY = (boxA.cy + boxB.cy) / 2;
    const startX = left.x + left.w;
    const endX = right.x;
    const centerX = (startX + endX) / 2;
    const colors = pairColors(state, pair.a, pair.b);
    paths.push({
      id: `pair-${pair.edge.id}`,
      d: line(startX, pairY, endX, pairY),
      stroke: colors.a,
      stroke2: colors.b,
      mixed: colors.mixed,
      kind: "pair",
      pairId: pair.edge.id,
    });

    if (!pair.children.length) continue;
    const childBoxes = pair.children.map((child) => ({ child, box: cardRect(child, mode) }));
    childBoxes.sort((a, b) => a.box.cx - b.box.cx);
    const railY = Math.min(...childBoxes.map((item) => item.box.y)) - 36;
    const trunkTop = pairY;
    const trunkBottom = railY;
    paths.push({
      id: `trunk-${pair.edge.id}`,
      d: line(centerX, trunkTop, centerX, trunkBottom),
      stroke: colors.mixed,
      kind: "trunk",
      pairId: pair.edge.id,
    });
    if (childBoxes.length > 1) {
      paths.push({
        id: `rail-${pair.edge.id}`,
        d: line(childBoxes[0].box.cx, railY, childBoxes[childBoxes.length - 1].box.cx, railY),
        stroke: colors.mixed,
        kind: "rail",
        pairId: pair.edge.id,
      });
    } else {
      paths.push({
        id: `rail-${pair.edge.id}`,
        d: line(centerX, railY, childBoxes[0].box.cx, railY),
        stroke: colors.mixed,
        kind: "rail",
        pairId: pair.edge.id,
      });
    }
    for (const item of childBoxes) {
      coveredChildren.add(item.child.id);
      paths.push({
        id: `drop-${pair.edge.id}-${item.child.id}`,
        d: line(item.box.cx, railY, item.box.cx, item.box.y),
        stroke: colors.mixed,
        kind: "drop",
        pairId: pair.edge.id,
      });
    }
  }

  for (const person of state.people) {
    if (person.isPlaceholder || coveredChildren.has(person.id)) continue;
    const parents = parentsOf(state, person.id);
    if (parents.length !== 1) continue;
    const parent = parents[0];
    const from = connectorPoint(parent, "bottom", mode);
    const to = connectorPoint(person, "top", mode);
    const color = pairColors(state, parent, parent).mixed;
    const midY = (from.y + to.y) / 2;
    paths.push({
      id: `solo-${parent.id}-${person.id}`,
      d: `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`,
      stroke: color,
      kind: "drop",
    });
  }

  return paths;
}

export function generationYs(people: Person[]): number[] {
  return [...new Set(people.filter((person) => !person.isPlaceholder).map((person) => Math.round(person.y)))].sort(
    (a, b) => a - b,
  );
}
