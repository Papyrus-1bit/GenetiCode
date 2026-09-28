import type { Edge, GenealogyState, Person } from "./types";
import { parentsOf, childrenOf, partnerOf } from "./family";
import { gendered, resolveGender } from "./age";

export function kinLabel(originId: string, target: Person, state: GenealogyState): string {
  if (originId === target.id) return "выбранный человек";
  const origin = state.people.find((person) => person.id === originId);
  if (!origin) return "родственник";

  const parents = (id: string) => parentsOf(state, id).map((person) => person.id);
  const kids = (id: string) => childrenOf(state, id).map((person) => person.id);
  const partners = (id: string) => partnerOf(state.edges, id);
  const shareParents = (a: string, b: string) => parents(a).some((id) => parents(b).includes(id));

  if (parents(originId).includes(target.id)) return gendered(target, "отец", "мать", "родитель");
  if (kids(originId).includes(target.id)) return gendered(target, "сын", "дочь", "ребёнок");
  if (partners(originId).includes(target.id)) return gendered(target, "муж", "жена", "партнёр");
  if (shareParents(originId, target.id) || state.edges.some((edge) => edge.type === "sibling" && ((edge.from_id === originId && edge.to_id === target.id) || (edge.from_id === target.id && edge.to_id === originId)))) {
    return gendered(target, "брат", "сестра", "брат/сестра");
  }
  const originParents = parents(originId);
  if (originParents.some((id) => parents(id).includes(target.id))) return gendered(target, "дед", "бабушка", "прародитель");
  if (kids(originId).some((id) => kids(id).includes(target.id))) return gendered(target, "внук", "внучка", "внук/внучка");
  return "родственник";
}

export function pairStatusLabel(status: Edge["relationship_status"]): string {
  return {
    unspecified: "Статус не указан",
    engaged: "Помолвлены",
    married: "Женаты",
    divorced: "Разведены",
  }[status];
}

export function edgeCaption(edge: Edge, people: Person[]): string {
  const from = people.find((person) => person.id === edge.from_id);
  const to = people.find((person) => person.id === edge.to_id);
  return `${from?.name || "?"} → ${to?.name || "?"}`;
}

export { resolveGender };
