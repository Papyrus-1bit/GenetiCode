"use client";

import { memo } from "react";
import type { CardMode, ConnectorSide, GenealogyState, Person } from "@/lib/types";
import { CARD_SIZE, SELF_ID } from "@/lib/types";
import { formatAge, isDeceased } from "@/lib/age";
import { initials } from "@/lib/id";
import { kinLabel } from "@/lib/kin";
import { colorById } from "@/lib/palette";

export const PersonCard = memo(function PersonCard({
  person,
  state,
  mode,
  selected,
  multi,
  originId,
  onPointerDown,
  onClick,
  onConnectStart,
}: {
  person: Person;
  state: GenealogyState;
  mode: CardMode;
  selected: boolean;
  multi: boolean;
  originId: string;
  onPointerDown: (event: React.PointerEvent, id: string) => void;
  onClick: (event: React.PointerEvent, id: string) => void;
  onConnectStart: (event: React.PointerEvent, id: string, side: ConnectorSide) => void;
}) {
  const size = CARD_SIZE[mode];
  const groups = state.groups.filter((group) => group.member_ids.includes(person.id));
  const primary = groups.find((group) => group.id === person.primaryGroupId) || groups[0];
  const groupColor = primary ? colorById(primary.groupColorId).hex : "";
  const photo = person.photo_data || state.photos[person.id];
  const dead = isDeceased(person);
  const compact = mode === "compact";
  const classes = [
    "person-node",
    selected ? "is-selected" : "",
    multi ? "is-multi-selected" : "",
    person.id === SELF_ID ? "is-self" : "",
    dead ? "is-deceased" : "",
    person.isPlaceholder ? "is-unknown" : "",
    primary ? "has-group" : "",
    compact ? "mode-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      style={{
        width: size.w,
        height: compact && person.isPlaceholder ? 180 : size.h,
        left: person.x,
        top: person.y,
        ["--group-color" as string]: groupColor || "transparent",
      }}
      onPointerDown={(event) => onPointerDown(event, person.id)}
      onClick={(event) => onClick(event as unknown as React.PointerEvent, person.id)}
    >
      {(["top", "right", "bottom", "left"] as ConnectorSide[]).map((side) => (
        <span
          key={side}
          className={`node-connector ${side}`}
          title="Потянуть связь"
          onPointerDown={(event) => {
            event.stopPropagation();
            onConnectStart(event, person.id, side);
          }}
        />
      ))}
      {multi && <span className="multi-check">✓</span>}
      {dead && !person.isPlaceholder && (
        <span className="death-corner" aria-hidden>
          <b>†</b>
        </span>
      )}
      {!compact && (
        <div className={`avatar ${person.id === SELF_ID ? "self" : ""}`}>
          {photo ? <img src={photo} alt="" /> : person.isPlaceholder ? "?" : initials(person.name)}
        </div>
      )}
      <div className="node-body">
        <strong>{person.name}</strong>
        {!person.isPlaceholder && <span className="node-age">{formatAge(person)}</span>}
        {!compact && !person.isPlaceholder && (
          <span className="node-meta">
            {person.born || "дата неизвестна"}
            {dead ? ` — † ${person.died || "дата неизвестна"}` : ""}
          </span>
        )}
        {!compact && person.birth_place && <span className="node-meta">{person.birth_place}</span>}
        {!compact && person.death_place && <span className="node-meta">{person.death_place}</span>}
        <span className="node-kind">
          {person.isPlaceholder ? "указать человека" : kinLabel(originId, person, state)}
        </span>
        {person.isPlaceholder && <span className="unknown-assign">+ указать</span>}
      </div>
      {groups.length > 0 && !person.isPlaceholder && (
        <span className="group-colors" style={{ background: groupColor }} />
      )}
    </article>
  );
});
