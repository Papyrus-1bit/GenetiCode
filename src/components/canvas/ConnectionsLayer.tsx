"use client";

import type { CardMode, GenealogyState } from "@/lib/types";
import { buildFamilyPaths, cardRect, generationYs } from "@/lib/geometry";
import { pairStatusLabel } from "@/lib/kin";
import { listParentPairs } from "@/lib/family";

export function ConnectionsLayer({
  state,
  mode,
  hoverId,
  preview,
}: {
  state: GenealogyState;
  mode: CardMode;
  hoverId: string | null;
  preview: string | null;
}) {
  const paths = buildFamilyPaths(state, mode);
  const gens = generationYs(state.people);
  const width = Math.max(2800, ...state.people.map((person) => person.x + 400));
  const height = Math.max(1600, ...state.people.map((person) => person.y + 400));
  const pairs = listParentPairs(state);

  return (
    <svg className="connections" width={width} height={height} aria-hidden>
      <g className="generation-shelves">
        {gens.map((y, index) => (
          <g key={y}>
            <line x1={-200} x2={width} y1={y - 38} y2={y - 38} />
            <text x={24} y={y - 49}>
              {index + 1}-е поколение
            </text>
          </g>
        ))}
      </g>
      <defs>
        {paths
          .filter((path) => path.stroke2 && path.kind === "pair")
          .map((path) => (
            <linearGradient key={`g-${path.id}`} id={`g-${path.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={path.stroke} />
              <stop offset="50%" stopColor={path.mixed || path.stroke} />
              <stop offset="100%" stopColor={path.stroke2} />
            </linearGradient>
          ))}
      </defs>
      {paths.map((path) => (
        <path
          key={path.id}
          className={`family-edge ${hoverId === path.id ? "is-hot" : ""}`}
          d={path.d}
          stroke={path.kind === "pair" && path.stroke2 ? `url(#g-${path.id})` : path.stroke}
        />
      ))}
      {pairs.map((pair) => {
        const a = cardRect(pair.a, mode);
        const b = cardRect(pair.b, mode);
        const x = (a.cx + b.cx) / 2;
        const y = Math.min(a.cy, b.cy);
        const label = pairStatusLabel(pair.edge.relationship_status);
        if (pair.edge.relationship_status === "unspecified") return null;
        return (
          <g key={`mark-${pair.edge.id}`} className="partner-mark" transform={`translate(${x - 18}, ${y - 12})`}>
            <rect className="partner-mark-paper" x={0} y={0} width={36} height={16} rx={2} />
            <text className="partner-mark-label" x={18} y={12} textAnchor="middle">
              {label === "Женаты" ? "∞" : label === "Разведены" ? "/" : "○"}
            </text>
          </g>
        );
      })}
      {preview && <path className="connection-preview" d={preview} />}
    </svg>
  );
}
