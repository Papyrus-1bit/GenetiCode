import type { CoatOfArms, Candidate, Edge, GenealogyState, Person } from "./types";
import { SCHEMA_VERSION } from "./types";
import { nearestPaletteColor, colorById, DEFAULT_GROUP_COLOR_ID } from "./palette";
import { normalizeFamily } from "./family";
import { migrateArms } from "./heraldry/migrate";
import { createSeedState } from "./seed";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function migratePerson(raw: Record<string, unknown>, index: number): Person {
  const name = asString(raw.name, "Без имени");
  return {
    id: asString(raw.id, `person_${index}`),
    name,
    born: asString(raw.born),
    died: asString(raw.died),
    place: asString(raw.place || raw.birth_place),
    birth_place: asString(raw.birth_place || raw.place),
    death_place: asString(raw.death_place),
    gender: raw.gender === "male" || raw.gender === "female" ? raw.gender : "unknown",
    is_deceased: asBool(raw.is_deceased, Boolean(asString(raw.died))),
    note: asString(raw.note),
    x: asNumber(raw.x, 80 + index * 40),
    y: asNumber(raw.y, 80 + index * 20),
    status: asString(raw.status, "family"),
    source_label: asString(raw.source_label, "Семейные сведения"),
    photo_key: asString(raw.photo_key),
    photo_data: asString(raw.photo_data),
    created_at: asString(raw.created_at),
    primaryGroupId: asString(raw.primaryGroupId),
    type: raw.type === "unknown-person" || raw.isPlaceholder ? "unknown-person" : "person",
    isPlaceholder: asBool(raw.isPlaceholder, raw.type === "unknown-person"),
    familyContextId: asString(raw.familyContextId),
  };
}

export function migrateState(raw: unknown): GenealogyState {
  const seed = createSeedState();
  if (!raw || typeof raw !== "object") return normalizeFamily(seed);
  const data = raw as Record<string, unknown>;
  const peopleIn = Array.isArray(data.people) ? data.people : seed.people;
  const people = peopleIn.map((item, index) => migratePerson((item || {}) as Record<string, unknown>, index));

  const edges: Edge[] = (Array.isArray(data.edges) ? data.edges : seed.edges).map((item, index) => {
    const edge = (item || {}) as Record<string, unknown>;
    const type: Edge["type"] = edge.type === "partner" || edge.type === "sibling" ? edge.type : "parent";
    const status: Edge["relationship_status"] =
      edge.relationship_status === "engaged" ||
      edge.relationship_status === "married" ||
      edge.relationship_status === "divorced"
        ? edge.relationship_status
        : "unspecified";
    return {
      id: asString(edge.id, `edge_${index}`),
      from_id: asString(edge.from_id || edge.fromId),
      to_id: asString(edge.to_id || edge.toId),
      type,
      status: asString(edge.status, "family"),
      relationship_status: status,
      color: asString(edge.color, "#9fc7c9"),
    };
  }).filter((edge) => edge.from_id && edge.to_id && edge.from_id !== edge.to_id);

  const groups = (Array.isArray(data.groups) ? data.groups : []).map((item, index) => {
    const group = (item || {}) as Record<string, unknown>;
    const legacyHex = asString(group.color, colorById(DEFAULT_GROUP_COLOR_ID).hex);
    const mapped = group.groupColorId ? colorById(asString(group.groupColorId)) : nearestPaletteColor(legacyHex);
    return {
      id: asString(group.id, `group_${index}`),
      name: asString(group.name, "Группа"),
      type: group.type === "family" ? "family" as const : "surname" as const,
      color: mapped.hex,
      groupColorId: mapped.id,
      member_ids: Array.isArray(group.member_ids)
        ? group.member_ids.filter((id): id is string => typeof id === "string")
        : [],
    };
  });

  for (const person of people) {
    const memberships = groups.filter((group) => group.member_ids.includes(person.id));
    if (!person.primaryGroupId || !memberships.some((group) => group.id === person.primaryGroupId)) {
      person.primaryGroupId = memberships[0]?.id || "";
    }
  }

  const candidates: Candidate[] = (Array.isArray(data.candidates) ? data.candidates : seed.candidates).map((item, index) => {
    const candidate = (item || {}) as Record<string, unknown>;
    const status: Candidate["status"] =
      candidate.status === "saved" || candidate.status === "attached" || candidate.status === "dismissed"
        ? candidate.status
        : "new";
    return {
      id: asString(candidate.id, `cand_${index}`),
      title: asString(candidate.title, "Находка"),
      excerpt: asString(candidate.excerpt),
      source_url: asString(candidate.source_url),
      query: asString(candidate.query),
      place: asString(candidate.place),
      category: asString(candidate.category, "Форум ВГД"),
      source_name: asString(candidate.source_name, "forum.vgd.ru"),
      status,
      linked_person_id: typeof candidate.linked_person_id === "string" ? candidate.linked_person_id : null,
      discovered_at: asString(candidate.discovered_at),
    };
  });

  const arms = (Array.isArray(data.arms) ? data.arms : []).map((item, index) =>
    migrateArms((item || {}) as Partial<CoatOfArms> & Record<string, unknown>, index),
  );

  const settings = (data.settings && typeof data.settings === "object" ? data.settings : {}) as Record<string, unknown>;
  const photos =
    data.photos && typeof data.photos === "object"
      ? Object.fromEntries(
          Object.entries(data.photos as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};

  const migrated: GenealogyState = {
    schemaVersion: SCHEMA_VERSION,
    people,
    edges,
    groups,
    candidates,
    arms,
    settings: {
      tree_title: asString(settings.tree_title, seed.settings.tree_title),
    },
    photos,
  };

  return normalizeFamily(migrated);
}

export function migrateTwiceStable(raw: unknown): boolean {
  const once = migrateState(raw);
  const twice = migrateState(once);
  return (
    once.people.length === twice.people.length &&
    once.edges.length === twice.edges.length &&
    once.groups.length === twice.groups.length
  );
}
