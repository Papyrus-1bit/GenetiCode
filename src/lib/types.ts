export const SCHEMA_VERSION = 2;

export type Gender = "male" | "female" | "unknown";
export type CardMode = "compact" | "standard";
export type PersonKind = "person" | "unknown-person";
export type EdgeType = "parent" | "partner" | "sibling";
export type PairStatus = "unspecified" | "engaged" | "married" | "divorced";
export type GroupKind = "surname" | "family";
export type CandidateStatus = "new" | "saved" | "attached" | "dismissed";

export type ConnectorSide = "top" | "right" | "bottom" | "left";

export interface Person {
  id: string;
  name: string;
  born: string;
  died: string;
  place: string;
  birth_place: string;
  death_place: string;
  gender: Gender;
  is_deceased: boolean;
  note: string;
  x: number;
  y: number;
  status: string;
  source_label: string;
  photo_key: string;
  photo_data: string;
  created_at: string;
  primaryGroupId: string;
  type: PersonKind;
  isPlaceholder: boolean;
  familyContextId: string;
}

export interface Edge {
  id: string;
  from_id: string;
  to_id: string;
  type: EdgeType;
  status: string;
  relationship_status: PairStatus;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupKind;
  color: string;
  groupColorId: string;
  member_ids: string[];
}

export interface Candidate {
  id: string;
  title: string;
  excerpt: string;
  source_url: string;
  query: string;
  place: string;
  category: string;
  source_name: string;
  status: CandidateStatus;
  linked_person_id: string | null;
  discovered_at: string;
}

export type ShieldShape = "classic" | "heater" | "french" | "spanish" | "banner";
export type DivisionKind =
  | "plain"
  | "per_pale"
  | "per_fess"
  | "per_bend"
  | "quarterly"
  | "chevron";

export type HeraldryLayerType = "shield" | "field" | "division" | "asset" | "image";

export interface HeraldryTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface HeraldryLayer extends HeraldryTransform {
  id: string;
  type: HeraldryLayerType;
  name: string;
  assetId?: string;
  svgMarkup?: string;
  imageData?: string;
  colorId?: string;
  color?: string;
}

export interface HeraldryDocument {
  width: number;
  height: number;
  shield: {
    shape: ShieldShape;
    locked: true;
  };
  field: {
    colorId: string;
    color: string;
    locked: true;
  };
  division: {
    kind: DivisionKind;
    colorId: string;
    color: string;
    locked: true;
  };
  layers: HeraldryLayer[];
}

export interface CoatOfArms {
  id: string;
  name: string;
  edge_id: string;
  shape: ShieldShape;
  division: DivisionKind;
  primary_color: string;
  secondary_color: string;
  charge: string;
  charge_color: string;
  motto: string;
  parent_left_id: string;
  parent_right_id: string;
  document: HeraldryDocument;
}

export interface Settings {
  tree_title: string;
}

export interface GenealogyState {
  schemaVersion: number;
  people: Person[];
  edges: Edge[];
  groups: Group[];
  candidates: Candidate[];
  arms: CoatOfArms[];
  settings: Settings;
  photos: Record<string, string>;
}

export const CARD_SIZE: Record<CardMode, { w: number; h: number }> = {
  compact: { w: 180, h: 266 },
  standard: { w: 220, h: 354 },
};

export const MINI_ZOOM_THRESHOLD = 0.62;
export const PHOTO_LIMIT_BYTES = 5 * 1024 * 1024;
export const NEUTRAL_LINE = "#9fc7c9";
export const SURFACE = "#fffdf7";
export const SELF_ID = "vova";
