import type { Edge, GenealogyState, PairStatus, Person } from "./types";
import { CARD_SIZE, NEUTRAL_LINE } from "./types";
import { pairKey, samePair, todayStamp, uid } from "./id";

export function parentsOf(state: GenealogyState, childId: string): Person[] {
  return state.edges
    .filter((edge) => edge.type === "parent" && edge.to_id === childId)
    .map((edge) => state.people.find((person) => person.id === edge.from_id))
    .filter((person): person is Person => Boolean(person));
}

export function childrenOf(state: GenealogyState, parentId: string): Person[] {
  return state.edges
    .filter((edge) => edge.type === "parent" && edge.from_id === parentId)
    .map((edge) => state.people.find((person) => person.id === edge.to_id))
    .filter((person): person is Person => Boolean(person));
}

export function findUndirectedEdge(
  edges: Edge[],
  a: string,
  b: string,
  type?: Edge["type"],
): Edge | undefined {
  return edges.find(
    (edge) => (!type || edge.type === type) && samePair(edge.from_id, edge.to_id, a, b),
  );
}

export function findPairEdge(edges: Edge[], a: string, b: string): Edge | undefined {
  return findUndirectedEdge(edges, a, b, "partner");
}

export function partnerOf(edges: Edge[], personId: string): string[] {
  return edges
    .filter((edge) => edge.type === "partner" && (edge.from_id === personId || edge.to_id === personId))
    .map((edge) => (edge.from_id === personId ? edge.to_id : edge.from_id));
}

function makePlaceholder(contextId: string, x: number, y: number): Person {
  return {
    id: uid("unknown"),
    name: "Неизвестный",
    born: "",
    died: "",
    place: "",
    birth_place: "",
    death_place: "",
    gender: "unknown",
    is_deceased: false,
    note: "",
    x,
    y,
    status: "family",
    source_label: "Системная карточка",
    photo_key: "",
    photo_data: "",
    created_at: todayStamp(),
    primaryGroupId: "",
    type: "unknown-person",
    isPlaceholder: true,
    familyContextId: contextId,
  };
}

function makePair(a: string, b: string, status: PairStatus = "unspecified"): Edge {
  return {
    id: uid("pair"),
    from_id: a,
    to_id: b,
    type: "partner",
    status: "family",
    relationship_status: status,
    color: NEUTRAL_LINE,
  };
}

function ensurePair(state: GenealogyState, a: string, b: string): Edge {
  const existing = findPairEdge(state.edges, a, b);
  if (existing) return existing;
  const edge = makePair(a, b);
  state.edges.push(edge);
  return edge;
}

function ensureParentLink(state: GenealogyState, parentId: string, childId: string) {
  if (findUndirectedEdge(state.edges, parentId, childId, "parent") && state.edges.some((edge) => edge.type === "parent" && edge.from_id === parentId && edge.to_id === childId)) {
    return;
  }
  if (state.edges.some((edge) => edge.type === "parent" && edge.from_id === parentId && edge.to_id === childId)) {
    return;
  }
  state.edges.push({
    id: uid("e"),
    from_id: parentId,
    to_id: childId,
    type: "parent",
    status: "family",
    relationship_status: "unspecified",
    color: NEUTRAL_LINE,
  });
}

export function normalizeFamily(input: GenealogyState): GenealogyState {
  const state: GenealogyState = {
    ...input,
    people: input.people.map((person) => ({ ...person })),
    edges: input.edges.map((edge) => ({ ...edge })),
  };

  const children = new Set(
    state.edges.filter((edge) => edge.type === "parent").map((edge) => edge.to_id),
  );

  for (const childId of children) {
    const child = state.people.find((person) => person.id === childId);
    if (!child || child.isPlaceholder) continue;
    const parents = parentsOf(state, childId).filter((person) => !person.isPlaceholder || person.familyContextId);
    const realParents = parentsOf(state, childId);

    if (realParents.length >= 2) {
      const [a, b] = realParents;
      ensurePair(state, a.id, b.id);
      continue;
    }

    if (realParents.length === 1) {
      const known = realParents[0];
      const contextSeed = `child:${childId}:with:${known.id}`;
      const existingPlaceholder = state.people.find(
        (person) =>
          person.isPlaceholder &&
          (person.familyContextId === contextSeed ||
            (findPairEdge(state.edges, known.id, person.id) &&
              state.edges.some((edge) => edge.type === "parent" && edge.from_id === person.id && edge.to_id === childId))),
      );
      if (existingPlaceholder) {
        ensurePair(state, known.id, existingPlaceholder.id);
        ensureParentLink(state, existingPlaceholder.id, childId);
        existingPlaceholder.familyContextId = existingPlaceholder.familyContextId || contextSeed;
        continue;
      }
      const size = CARD_SIZE.standard;
      const placeholder = makePlaceholder(contextSeed, known.x + size.w + 80, known.y);
      state.people.push(placeholder);
      ensurePair(state, known.id, placeholder.id);
      ensureParentLink(state, placeholder.id, childId);
    }
  }

  const usedPlaceholderIds = new Set<string>();
  for (const person of state.people) {
    if (!person.isPlaceholder) continue;
    const kids = childrenOf(state, person.id);
    if (kids.length === 0) continue;
    usedPlaceholderIds.add(person.id);
  }
  state.people = state.people.filter((person) => !person.isPlaceholder || usedPlaceholderIds.has(person.id));
  const alive = new Set(state.people.map((person) => person.id));
  state.edges = state.edges.filter((edge) => alive.has(edge.from_id) && alive.has(edge.to_id));

  const seenPairs = new Set<string>();
  state.edges = state.edges.filter((edge) => {
    if (edge.type !== "partner") return true;
    const key = pairKey(edge.from_id, edge.to_id);
    if (seenPairs.has(key)) return false;
    seenPairs.add(key);
    return true;
  });

  const seenParents = new Set<string>();
  state.edges = state.edges.filter((edge) => {
    if (edge.type !== "parent") return true;
    const key = `${edge.from_id}->${edge.to_id}`;
    if (seenParents.has(key)) return false;
    seenParents.add(key);
    return true;
  });

  return state;
}

export function addRelation(
  state: GenealogyState,
  fromId: string,
  toId: string,
  role: "parent" | "child" | "partner" | "sibling",
  pairStatus: PairStatus = "unspecified",
): GenealogyState {
  if (fromId === toId) return state;
  const next: GenealogyState = {
    ...state,
    people: state.people.map((person) => ({ ...person })),
    edges: state.edges.map((edge) => ({ ...edge })),
  };

  if (role === "partner") {
    const existing = findPairEdge(next.edges, fromId, toId);
    if (existing) {
      existing.relationship_status = pairStatus;
      return normalizeFamily(next);
    }
    next.edges.push(makePair(fromId, toId, pairStatus));
    return normalizeFamily(next);
  }

  if (role === "sibling") {
    if (!findUndirectedEdge(next.edges, fromId, toId, "sibling")) {
      next.edges.push({
        id: uid("sib"),
        from_id: fromId,
        to_id: toId,
        type: "sibling",
        status: "family",
        relationship_status: "unspecified",
        color: NEUTRAL_LINE,
      });
    }
    return normalizeFamily(next);
  }

  const parentId = role === "parent" ? toId : fromId;
  const childId = role === "parent" ? fromId : toId;
  ensureParentLink(next, parentId, childId);
  return replaceUnknownIfFilled(normalizeFamily(next), childId);
}

function replaceUnknownIfFilled(state: GenealogyState, childId: string): GenealogyState {
  const parents = parentsOf(state, childId);
  const real = parents.filter((person) => !person.isPlaceholder);
  const unknown = parents.filter((person) => person.isPlaceholder);
  if (real.length < 2 || unknown.length === 0) return state;
  const extraUnknown = unknown;
  const keep = real.slice(0, 2);
  ensurePair(state, keep[0].id, keep[1].id);
  for (const placeholder of extraUnknown) {
    state.edges = state.edges.filter(
      (edge) => edge.from_id !== placeholder.id && edge.to_id !== placeholder.id,
    );
    state.people = state.people.filter((person) => person.id !== placeholder.id);
  }
  return normalizeFamily(state);
}

export function replacePlaceholder(state: GenealogyState, placeholderId: string, realPersonId: string): GenealogyState {
  const placeholder = state.people.find((person) => person.id === placeholderId);
  if (!placeholder?.isPlaceholder) return state;
  const next: GenealogyState = {
    ...state,
    people: state.people.map((person) => ({ ...person })),
    edges: state.edges.map((edge) =>
      edge.from_id === placeholderId || edge.to_id === placeholderId
        ? {
            ...edge,
            from_id: edge.from_id === placeholderId ? realPersonId : edge.from_id,
            to_id: edge.to_id === placeholderId ? realPersonId : edge.to_id,
          }
        : { ...edge },
    ),
  };
  next.people = next.people.filter((person) => person.id !== placeholderId);
  next.edges = next.edges.filter((edge) => edge.from_id !== edge.to_id);
  return normalizeFamily(next);
}

export function removePerson(state: GenealogyState, personId: string): GenealogyState {
  const next: GenealogyState = {
    ...state,
    people: state.people.filter((person) => person.id !== personId),
    edges: state.edges.filter((edge) => edge.from_id !== personId && edge.to_id !== personId),
    groups: state.groups.map((group) => ({
      ...group,
      member_ids: group.member_ids.filter((id) => id !== personId),
    })),
  };
  return normalizeFamily(next);
}

export function removeEdge(state: GenealogyState, edgeId: string): GenealogyState {
  return normalizeFamily({
    ...state,
    edges: state.edges.filter((edge) => edge.id !== edgeId),
  });
}

export function listParentPairs(state: GenealogyState): { a: Person; b: Person; edge: Edge; children: Person[] }[] {
  const pairs: { a: Person; b: Person; edge: Edge; children: Person[] }[] = [];
  const seen = new Set<string>();
  for (const edge of state.edges.filter((item) => item.type === "partner")) {
    const key = pairKey(edge.from_id, edge.to_id);
    if (seen.has(key)) continue;
    seen.add(key);
    const a = state.people.find((person) => person.id === edge.from_id);
    const b = state.people.find((person) => person.id === edge.to_id);
    if (!a || !b) continue;
    const children = state.people.filter((child) => {
      if (child.isPlaceholder) return false;
      const parentIds = parentsOf(state, child.id).map((person) => person.id);
      return parentIds.includes(a.id) && parentIds.includes(b.id);
    });
    pairs.push({ a, b, edge, children });
  }
  return pairs;
}
