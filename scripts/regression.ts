import { createSeedState } from "../src/lib/seed";
import { migrateState } from "../src/lib/migrations";
import { addRelation, listParentPairs, parentsOf } from "../src/lib/family";
import { nearestPaletteColor } from "../src/lib/palette";
import { mixOklab } from "../src/lib/oklab";
import type { GenealogyState, Person } from "../src/lib/types";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function person(id: string, name: string, x: number, y: number): Person {
  return {
    id,
    name,
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
    source_label: "",
    photo_key: "",
    photo_data: "",
    created_at: "",
    primaryGroupId: "",
    type: "person",
    isPlaceholder: false,
    familyContextId: "",
  };
}

const seed = migrateState(createSeedState());
const twice = migrateState(seed);
assert(seed.people.length === twice.people.length, "people idempotent");
assert(seed.edges.length === twice.edges.length, "edges idempotent");

const vovaParents = parentsOf(seed, "vova");
assert(vovaParents.length === 2, "vova has 2 parents");
const pairs = listParentPairs(seed);
const vovaPair = pairs.find((pair) => pair.children.some((child) => child.id === "vova"));
assert(vovaPair, "vova pair exists");

let one: GenealogyState = migrateState({
  people: [person("ivan", "Иван", 0, 0), person("petr", "Пётр", 0, 200)],
  edges: [{ id: "e1", from_id: "ivan", to_id: "petr", type: "parent", status: "family", relationship_status: "unspecified", color: "#9fc7c9" }],
  groups: [],
  candidates: [],
  arms: [],
  settings: { tree_title: "t" },
  photos: {},
  schemaVersion: 1,
});
assert(one.people.some((item) => item.isPlaceholder), "unknown created");
const unknownId = one.people.find((item) => item.isPlaceholder)!.id;
const again = migrateState(one);
assert(again.people.filter((item) => item.isPlaceholder).length === 1, "unknown not duplicated");

one = {
  ...one,
  people: [...one.people, person("maria", "Мария", 240, 0)],
};
one = addRelation(one, "maria", "petr", "child");
assert(!one.people.some((item) => item.isPlaceholder), "no leftover unknown");
assert(parentsOf(one, "petr").map((item) => item.id).sort().join() === "ivan,maria", "two real parents");
const after = addRelation(one, "maria", "petr", "child");
assert(
  after.edges.filter((edge) => edge.type === "partner").length === one.edges.filter((edge) => edge.type === "partner").length,
  "no duplicate pair",
);
assert(
  after.edges.filter((edge) => edge.type === "parent" && edge.from_id === "maria" && edge.to_id === "petr").length === 1,
  "no duplicate parent edge",
);

const nearest = nearestPaletteColor("#3B82F6");
assert(nearest.id.startsWith("blue"), "blue maps to blue, got " + nearest.id);
const mixed = mixOklab("#3B82F6", "#F59E0B", 0.5);
assert(mixed.startsWith("#"), "mix hex");

console.log("regression ok", {
  people: seed.people.length,
  edges: seed.edges.length,
  pairs: pairs.length,
  mixed,
  nearest: nearest.id,
});
