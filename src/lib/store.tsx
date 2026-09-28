"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type {
  CardMode,
  CoatOfArms,
  Candidate,
  Edge,
  GenealogyState,
  Group,
  GroupKind,
  PairStatus,
  Person,
} from "./types";
import { PHOTO_LIMIT_BYTES } from "./types";
import { loadState, saveState } from "./persistence";
import { addRelation, normalizeFamily, removeEdge, removePerson, replacePlaceholder } from "./family";
import { uid, todayStamp } from "./id";
import { colorById, DEFAULT_GROUP_COLOR_ID } from "./palette";
import { emptyArms } from "./heraldry/migrate";
import { syncCoatFromDocument } from "./heraldry/document";

type PanelId = "people" | "groups" | "sources" | "search" | null;

interface UiState {
  selectedIds: string[];
  multiMode: boolean;
  cardMode: CardMode;
  leftPanel: PanelId;
  inspectorOpen: boolean;
  toast: { text: string; error?: boolean } | null;
  loaded: boolean;
  saving: boolean;
}

type Action =
  | { type: "hydrate"; state: GenealogyState }
  | { type: "replace"; state: GenealogyState }
  | { type: "patchPerson"; id: string; patch: Partial<Person> }
  | { type: "addPerson"; person: Person }
  | { type: "select"; ids: string[]; additive?: boolean }
  | { type: "ui"; patch: Partial<UiState> }
  | { type: "toast"; text: string; error?: boolean }
  | { type: "clearToast" };

interface Store {
  state: GenealogyState;
  ui: UiState;
  selected: Person | null;
  dispatchState: (state: GenealogyState) => void;
  select: (ids: string[], additive?: boolean) => void;
  setUi: (patch: Partial<UiState>) => void;
  notify: (text: string, error?: boolean) => void;
  savePerson: (input: Partial<Person> & { name: string }, relation?: { relatedId: string; role: "parent" | "child" | "partner" | "sibling" }) => Person;
  deletePerson: (id: string) => void;
  linkPeople: (fromId: string, toId: string, role: "parent" | "child" | "partner" | "sibling", pairStatus?: PairStatus) => void;
  unlink: (edgeId: string) => void;
  setPairStatus: (edgeId: string, status: PairStatus) => void;
  movePeople: (ids: string[], dx: number, dy: number) => void;
  setTitle: (title: string) => void;
  saveGroup: (input: { id?: string; name: string; type: GroupKind; groupColorId: string; member_ids: string[] }) => void;
  deleteGroup: (id: string) => void;
  setPrimaryGroup: (personId: string, groupId: string) => void;
  savePhoto: (personId: string, dataUrl: string) => void;
  clearPhoto: (personId: string) => void;
  saveArms: (arms: CoatOfArms) => void;
  deleteArms: (id: string) => void;
  attachCandidate: (candidateId: string, personId: string | null, status?: Candidate["status"]) => void;
  addCandidatePerson: (candidateId: string, relatedId?: string) => void;
  assignUnknown: (placeholderId: string, personId: string) => void;
}

const StoreContext = createContext<Store | null>(null);

const initialUi: UiState = {
  selectedIds: ["vova"],
  multiMode: false,
  cardMode: "standard",
  leftPanel: null,
  inspectorOpen: false,
  toast: null,
  loaded: false,
  saving: false,
};

function reducer(
  current: { data: GenealogyState | null; ui: UiState },
  action: Action,
): { data: GenealogyState | null; ui: UiState } {
  switch (action.type) {
    case "hydrate":
      return { data: action.state, ui: { ...current.ui, loaded: true } };
    case "replace":
      return { data: action.state, ui: current.ui };
    case "patchPerson":
      if (!current.data) return current;
      return {
        data: {
          ...current.data,
          people: current.data.people.map((person) => (person.id === action.id ? { ...person, ...action.patch } : person)),
        },
        ui: current.ui,
      };
    case "addPerson":
      if (!current.data) return current;
      return { data: { ...current.data, people: [...current.data.people, action.person] }, ui: current.ui };
    case "select": {
      const ids = action.additive
        ? Array.from(new Set([...current.ui.selectedIds, ...action.ids]))
        : action.ids;
      return {
        data: current.data,
        ui: { ...current.ui, selectedIds: ids, inspectorOpen: ids.length === 1 },
      };
    }
    case "ui":
      return { data: current.data, ui: { ...current.ui, ...action.patch } };
    case "toast":
      return { data: current.data, ui: { ...current.ui, toast: { text: action.text, error: action.error } } };
    case "clearToast":
      return { data: current.data, ui: { ...current.ui, toast: null } };
    default:
      return current;
  }
}

function blankPerson(name: string, x: number, y: number): Person {
  return {
    id: uid("p"),
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
    source_label: "Семейные сведения",
    photo_key: "",
    photo_data: "",
    created_at: todayStamp(),
    primaryGroupId: "",
    type: "person",
    isPlaceholder: false,
    familyContextId: "",
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [bundle, dispatch] = useReducer(reducer, { data: null, ui: initialUi });
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const mode = localStorage.getItem("genealogy-card-mode");
    if (mode === "compact" || mode === "standard") {
      dispatch({ type: "ui", patch: { cardMode: mode } });
    }
    loadState()
      .then((state) => {
        dispatch({ type: "hydrate", state });
      })
      .catch(() => dispatch({ type: "toast", text: "Не удалось загрузить дерево", error: true }));
  }, []);

  useEffect(() => {
    if (!bundle.data || !bundle.ui.loaded) return;
    dispatch({ type: "ui", patch: { saving: true } });
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveState(bundle.data!).finally(() => dispatch({ type: "ui", patch: { saving: false } }));
    }, 250);
  }, [bundle.data, bundle.ui.loaded]);

  useEffect(() => {
    if (!bundle.ui.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "clearToast" }), 3200);
    return () => window.clearTimeout(timer);
  }, [bundle.ui.toast]);

  const notify = useCallback((text: string, error = false) => {
    dispatch({ type: "toast", text, error });
  }, []);

  const dispatchState = useCallback((state: GenealogyState, normalize = true) => {
    dispatch({ type: "replace", state: normalize ? normalizeFamily(state) : state });
  }, []);

  const store = useMemo<Store>(() => {
    const state = bundle.data;
    const selected = state?.people.find((person) => person.id === bundle.ui.selectedIds[0]) || null;

    const withState = (updater: (current: GenealogyState) => GenealogyState, normalize = true) => {
      if (!state) return;
      dispatchState(updater(state), normalize);
    };

    return {
      state: state || {
        schemaVersion: 2,
        people: [],
        edges: [],
        groups: [],
        candidates: [],
        arms: [],
        settings: { tree_title: "Семейное дерево" },
        photos: {},
      },
      ui: bundle.ui,
      selected,
      dispatchState,
      select: (ids, additive) => dispatch({ type: "select", ids, additive }),
      setUi: (patch) => {
        if (patch.cardMode) localStorage.setItem("genealogy-card-mode", patch.cardMode);
        dispatch({ type: "ui", patch });
      },
      notify,
      savePerson: (input, relation) => {
        if (!state) return blankPerson(input.name, 400, 400);
        let person = state.people.find((item) => item.id === input.id);
        const created = !person;
        if (!person) {
          const anchor = relation?.relatedId ? state.people.find((item) => item.id === relation.relatedId) : selected;
          person = blankPerson(input.name, (anchor?.x || 400) + 240, (anchor?.y || 400) + (relation?.role === "parent" ? -240 : 240));
        }
        person = {
          ...person,
          ...input,
          birth_place: input.birth_place ?? input.place ?? person.birth_place,
          place: input.place ?? input.birth_place ?? person.place,
          is_deceased: Boolean(input.is_deceased || input.died),
        };
        let next: GenealogyState = created
          ? { ...state, people: [...state.people, person] }
          : { ...state, people: state.people.map((item) => (item.id === person!.id ? person! : item)) };
        if (relation?.relatedId) {
          next = addRelation(next, person.id, relation.relatedId, relation.role);
        }
        dispatchState(next);
        dispatch({ type: "select", ids: [person.id] });
        notify("Карточка сохранена");
        return person;
      },
      deletePerson: (id) => withState((current) => removePerson(current, id)),
      linkPeople: (fromId, toId, role, pairStatus) =>
        withState((current) => addRelation(current, fromId, toId, role, pairStatus)),
      unlink: (edgeId) => withState((current) => removeEdge(current, edgeId)),
      setPairStatus: (edgeId, status) =>
        withState((current) => ({
          ...current,
          edges: current.edges.map((edge) => (edge.id === edgeId ? { ...edge, relationship_status: status } : edge)),
        })),
      movePeople: (ids, dx, dy) =>
        withState(
          (current) => ({
            ...current,
            people: current.people.map((person) =>
              ids.includes(person.id) ? { ...person, x: person.x + dx, y: person.y + dy } : person,
            ),
          }),
          false,
        ),
      setTitle: (title) =>
        withState((current) => ({ ...current, settings: { ...current.settings, tree_title: title } })),
      saveGroup: (input) =>
        withState((current) => {
          const color = colorById(input.groupColorId || DEFAULT_GROUP_COLOR_ID);
          const group: Group = {
            id: input.id || uid("g"),
            name: input.name,
            type: input.type,
            color: color.hex,
            groupColorId: color.id,
            member_ids: input.member_ids,
          };
          const groups = input.id
            ? current.groups.map((item) => (item.id === input.id ? group : item))
            : [...current.groups, group];
          const people = current.people.map((person) => {
            if (!group.member_ids.includes(person.id)) return person;
            return person.primaryGroupId ? person : { ...person, primaryGroupId: group.id };
          });
          return { ...current, groups, people };
        }),
      deleteGroup: (id) =>
        withState((current) => ({
          ...current,
          groups: current.groups.filter((group) => group.id !== id),
          people: current.people.map((person) =>
            person.primaryGroupId === id ? { ...person, primaryGroupId: "" } : person,
          ),
        })),
      setPrimaryGroup: (personId, groupId) =>
        withState((current) => ({
          ...current,
          people: current.people.map((person) => (person.id === personId ? { ...person, primaryGroupId: groupId } : person)),
        })),
      savePhoto: (personId, dataUrl) => {
        if (dataUrl.length * 0.75 > PHOTO_LIMIT_BYTES) {
          notify("Фотография больше 5 МБ", true);
          return;
        }
        withState((current) => ({
          ...current,
          photos: { ...current.photos, [personId]: dataUrl },
          people: current.people.map((person) => (person.id === personId ? { ...person, photo_data: dataUrl } : person)),
        }));
        notify("Фотография сохранена");
      },
      clearPhoto: (personId) =>
        withState((current) => {
          const photos = { ...current.photos };
          delete photos[personId];
          return {
            ...current,
            photos,
            people: current.people.map((person) => (person.id === personId ? { ...person, photo_data: "" } : person)),
          };
        }),
      saveArms: (arms) =>
        withState((current) => {
          const synced = { ...arms, ...syncCoatFromDocument(arms.document) };
          const next = synced.id
            ? current.arms.map((item) => (item.id === synced.id ? synced : item))
            : [...current.arms, { ...synced, id: uid("arms") }];
          return { ...current, arms: next };
        }),
      deleteArms: (id) => withState((current) => ({ ...current, arms: current.arms.filter((item) => item.id !== id) })),
      attachCandidate: (candidateId, personId, status = "attached") =>
        withState((current) => ({
          ...current,
          candidates: current.candidates.map((item) =>
            item.id === candidateId
              ? { ...item, status: personId ? "attached" : status, linked_person_id: personId }
              : item,
          ),
        })),
      addCandidatePerson: (candidateId, relatedId) => {
        if (!state) return;
        const candidate = state.candidates.find((item) => item.id === candidateId);
        if (!candidate) return;
        const person = blankPerson(candidate.title.replace(/ ·.*/, ""), 900, 900);
        person.note = candidate.excerpt;
        person.place = candidate.place;
        person.birth_place = candidate.place;
        person.source_label = candidate.category;
        let next: GenealogyState = { ...state, people: [...state.people, person] };
        if (relatedId) next = addRelation(next, person.id, relatedId, "parent");
        next = {
          ...next,
          candidates: next.candidates.map((item) =>
            item.id === candidateId ? { ...item, status: "attached", linked_person_id: person.id } : item,
          ),
        };
        dispatchState(next);
        dispatch({ type: "select", ids: [person.id] });
        notify("Карточка сохранена");
      },
      assignUnknown: (placeholderId, personId) =>
        withState((current) => replacePlaceholder(current, placeholderId, personId)),
    };
  }, [bundle.data, bundle.ui, dispatchState, notify]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store missing");
  return value;
}
