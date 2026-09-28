"use client";

import { useMemo } from "react";
import type { CoatOfArms } from "@/lib/types";
import { SHIELD_PATHS } from "@/lib/heraldry/document";
import { assetById } from "@/lib/heraldry/assets";

export function CoatPreview({ value, small = false }: { value: CoatOfArms; small?: boolean }) {
  const path = SHIELD_PATHS[value.document?.shield.shape || value.shape || "classic"];
  const field = value.document?.field.color || value.primary_color;
  const clip = `c-${value.id || "new"}`;
  return (
    <div className={`coat-preview ${small ? "small" : ""}`} aria-label="Предпросмотр герба">
      <svg viewBox="0 0 1000 1200" aria-hidden>
        <defs>
          <clipPath id={clip}><path d={path} /></clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="1000" height="1200" fill={field} />
          <Division value={value} />
          {(value.document?.layers || []).filter((layer) => layer.visible).map((layer) => {
            const asset = assetById(layer.assetId);
            if (layer.imageData) {
              return <image key={layer.id} href={layer.imageData} x={layer.x} y={layer.y} width={layer.width} height={layer.height} opacity={layer.opacity} />;
            }
            return (
              <g key={layer.id} transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation} ${layer.width / 2} ${layer.height / 2})`} opacity={layer.opacity}>
                <svg viewBox="0 0 200 200" width={layer.width} height={layer.height}>
                  <path d={asset?.path || ""} fill={layer.color || "#F4EAD4"} />
                </svg>
              </g>
            );
          })}
        </g>
        <path d={path} fill="none" stroke="#29231d" strokeWidth="18" />
      </svg>
      {!small && <span className="coat-motto">{value.motto || "Девиз семьи"}</span>}
    </div>
  );
}

function Division({ value }: { value: CoatOfArms }) {
  const kind = value.document?.division.kind || value.division;
  const color = value.document?.division.color || value.secondary_color;
  if (kind === "plain") return null;
  if (kind === "per_pale") return <rect x={500} y={0} width={500} height={1200} fill={color} />;
  if (kind === "per_fess") return <rect x={0} y={600} width={1000} height={600} fill={color} />;
  if (kind === "per_bend") return <path d="M0 0 L1000 1200 L1000 0 Z" fill={color} />;
  if (kind === "quarterly") {
    return (
      <>
        <rect x={500} y={0} width={500} height={600} fill={color} />
        <rect x={0} y={600} width={500} height={600} fill={color} />
      </>
    );
  }
  if (kind === "chevron") return <path d="M0 780 L500 430 L1000 780 L1000 1200 L0 1200 Z" fill={color} />;
  return null;
}

export function useArmsForEdge(edgeId: string, arms: CoatOfArms[]) {
  return useMemo(() => arms.find((item) => item.edge_id === edgeId), [arms, edgeId]);
}
