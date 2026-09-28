"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Redo2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import type { CoatOfArms, DivisionKind, HeraldryDocument, HeraldryLayer, ShieldShape } from "@/lib/types";
import { PHOTO_LIMIT_BYTES } from "@/lib/types";
import { HERALDRY_ASSETS, ASSET_CATEGORIES, assetById } from "@/lib/heraldry/assets";
import { createAssetLayer, DOC_HEIGHT, DOC_WIDTH, SHIELD_PATHS, syncCoatFromDocument } from "@/lib/heraldry/document";
import { sanitizeSvg, fileToDataUrl } from "@/lib/heraldry/sanitize";
import { colorById } from "@/lib/palette";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { isTypingTarget } from "@/lib/id";
import { emptyArms } from "@/lib/heraldry/migrate";

interface Props {
  open: boolean;
  initial: CoatOfArms | null;
  onClose: () => void;
  onSave: (arms: CoatOfArms) => void;
}

const SHAPES: { id: ShieldShape; label: string }[] = [
  { id: "classic", label: "Классический" },
  { id: "heater", label: "Heater" },
  { id: "french", label: "Французский" },
  { id: "spanish", label: "Испанский" },
  { id: "banner", label: "Знамя" },
];

const DIVISIONS: { id: DivisionKind; label: string }[] = [
  { id: "plain", label: "Одно поле" },
  { id: "per_pale", label: "Рассечённый" },
  { id: "per_fess", label: "Пересечённый" },
  { id: "per_bend", label: "Скошенный" },
  { id: "quarterly", label: "Четверочастный" },
  { id: "chevron", label: "Стропило" },
];

export function HeraldryEditor({ open, initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<CoatOfArms>(emptyArms());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<HeraldryDocument[]>([]);
  const [future, setFuture] = useState<HeraldryDocument[]>([]);
  const [category, setCategory] = useState<string>("Птицы");
  const stage = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!open) return;
    const next = initial ? structuredClone(initial) : emptyArms();
    if (!next.document) next.document = emptyArms().document;
    setDraft(next);
    setSelectedId(next.document.layers[0]?.id || null);
    setPast([]);
    setFuture([]);
  }, [open, initial]);

  const pushHistory = useCallback((document: HeraldryDocument) => {
    setPast((list) => [...list.slice(-49), structuredClone(document)]);
    setFuture([]);
  }, []);

  const updateDoc = useCallback(
    (updater: (document: HeraldryDocument) => HeraldryDocument, record = true) => {
      setDraft((current) => {
        if (record) pushHistory(current.document);
        const document = updater(structuredClone(current.document));
        return { ...current, document, ...syncCoatFromDocument(document) };
      });
    },
    [pushHistory],
  );

  const selected = draft.document.layers.find((layer) => layer.id === selectedId) || null;

  const undo = () => {
    setPast((list) => {
      if (!list.length) return list;
      const prev = list[list.length - 1];
      setFuture((next) => [structuredClone(draft.document), ...next]);
      setDraft((current) => ({ ...current, document: prev, ...syncCoatFromDocument(prev) }));
      return list.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((list) => {
      if (!list.length) return list;
      const next = list[0];
      setPast((pastList) => [...pastList, structuredClone(draft.document)]);
      setDraft((current) => ({ ...current, document: next, ...syncCoatFromDocument(next) }));
      return list.slice(1);
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (meta && event.key.toLowerCase() === "d" && selected) {
        event.preventDefault();
        duplicate(selected);
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected && !selected.locked) {
        removeLayer(selected.id);
      }
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function duplicate(layer: HeraldryLayer) {
    updateDoc((document) => ({
      ...document,
      layers: [...document.layers, { ...layer, id: createAssetLayer(layer.name, layer.assetId || "oak").id, x: layer.x + 24, y: layer.y + 24 }],
    }));
  }
  function removeLayer(id: string) {
    updateDoc((document) => ({ ...document, layers: document.layers.filter((layer) => layer.id !== id) }));
    setSelectedId(null);
  }
  function moveLayer(id: string, direction: "up" | "down" | "top" | "bottom") {
    updateDoc((document) => {
      const layers = [...document.layers];
      const index = layers.findIndex((layer) => layer.id === id);
      if (index < 0) return document;
      const [layer] = layers.splice(index, 1);
      if (direction === "top") layers.push(layer);
      else if (direction === "bottom") layers.unshift(layer);
      else if (direction === "up") layers.splice(Math.min(layers.length, index + 1), 0, layer);
      else layers.splice(Math.max(0, index - 1), 0, layer);
      return { ...document, layers };
    });
  }
  function addAsset(assetId: string, extra?: Partial<HeraldryLayer>) {
    const asset = assetById(assetId);
    const layer = createAssetLayer(asset?.name || "Знак", assetId, extra);
    updateDoc((document) => ({ ...document, layers: [...document.layers, layer] }));
    setSelectedId(layer.id);
  }

  if (!open) return null;
  const clipId = "shield-clip";
  const path = SHIELD_PATHS[draft.document.shield.shape];

  return (
    <div className="herald-full">
      <div className="herald-bar">
        <button className="btn ghost" onClick={onClose}><ArrowLeft size={16} /> {draft.name || "Герб"}</button>
        <input className="tree-title-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <span style={{ marginLeft: "auto" }} />
        <button className="tool-btn" aria-label="Отменить" onClick={undo}><Undo2 size={16} /></button>
        <button className="tool-btn" aria-label="Повторить" onClick={redo}><Redo2 size={16} /></button>
        <button className="btn" onClick={() => { onSave(draft); onClose(); }}>Сохранить</button>
      </div>
      <div className="herald-body">
        <aside className="herald-col">
          <div className="arms-library-head"><strong>Assets</strong></div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ margin: 8 }}>
            {ASSET_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="asset-grid">
            {HERALDRY_ASSETS.filter((asset) => asset.category === category).map((asset) => (
              <button key={asset.id} type="button" className="asset-btn" title={asset.name} aria-label={asset.name} onClick={() => addAsset(asset.id)}>
                <svg viewBox="0 0 200 200" width="36" height="36"><path d={asset.path} fill="#5a3932" /></svg>
              </button>
            ))}
          </div>
          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="btn ghost">
              <Upload size={14} /> SVG
              <input hidden type="file" accept=".svg,image/svg+xml" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = sanitizeSvg(await file.text());
                addAsset("custom-svg", { type: "asset", name: file.name, svgMarkup: text });
              }} />
            </label>
            <label className="btn ghost">
              <Upload size={14} /> PNG / JPEG
              <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > PHOTO_LIMIT_BYTES) return;
                const data = await fileToDataUrl(file);
                addAsset("custom-image", { type: "image", name: file.name, imageData: data, width: 420, height: 420 });
              }} />
            </label>
          </div>
        </aside>
        <div className="herald-stage">
          <svg
            ref={stage}
            viewBox={`0 0 ${DOC_WIDTH} ${DOC_HEIGHT}`}
            width="min(420px, 46vw)"
            height="min(504px, 70vh)"
            onPointerDown={() => setSelectedId(null)}
          >
            <defs>
              <clipPath id={clipId}><path d={path} /></clipPath>
            </defs>
            <path d={path} fill={draft.document.field.color} />
            <g clipPath={`url(#${clipId})`}>
              <Division document={draft.document} />
              {draft.document.layers.filter((layer) => layer.visible).map((layer) => (
                <AssetNode
                  key={layer.id}
                  layer={layer}
                  selected={layer.id === selectedId}
                  onSelect={() => setSelectedId(layer.id)}
                  onChange={(patch) =>
                    updateDoc((document) => ({
                      ...document,
                      layers: document.layers.map((item) => (item.id === layer.id ? { ...item, ...patch } : item)),
                    }), false)
                  }
                  onCommit={() => pushHistory(draft.document)}
                />
              ))}
            </g>
            <path d={path} fill="none" stroke="#29231d" strokeWidth="18" />
            {selected && (
              <g pointerEvents="none">
                <rect className="bbox" x={selected.x} y={selected.y} width={selected.width} height={selected.height} transform={`rotate(${selected.rotation} ${selected.x + selected.width / 2} ${selected.y + selected.height / 2})`} />
              </g>
            )}
            <line x1={DOC_WIDTH / 2} y1={40} x2={DOC_WIDTH / 2} y2={DOC_HEIGHT - 40} stroke="#68443a44" strokeDasharray="6 10" />
            <line x1={40} y1={DOC_HEIGHT / 2} x2={DOC_WIDTH - 40} y2={DOC_HEIGHT / 2} stroke="#68443a44" strokeDasharray="6 10" />
          </svg>
          {draft.motto && <div className="coat-motto">{draft.motto}</div>}
        </div>
        <aside className="herald-col right">
          <div className="arms-library-head"><strong>Layers</strong></div>
          <div className="layer-row"><Lock size={12} /> Shield</div>
          <div className="layer-row"><Lock size={12} /> Field</div>
          <div className="layer-row"><Lock size={12} /> Division</div>
          {[...draft.document.layers].reverse().map((layer) => (
            <div key={layer.id} className={`layer-row ${layer.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(layer.id)}>
              <button type="button" className="tool-btn" aria-label={layer.visible ? "Скрыть" : "Показать"} onClick={(event) => { event.stopPropagation(); updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === layer.id ? { ...item, visible: !item.visible } : item) })); }}>
                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <span>{layer.name}</span>
              <button type="button" className="tool-btn" aria-label={layer.locked ? "Разблокировать" : "Заблокировать"} onClick={(event) => { event.stopPropagation(); updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === layer.id ? { ...item, locked: !item.locked } : item) })); }}>
                {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
              <button type="button" className="tool-btn" aria-label="Удалить" onClick={(event) => { event.stopPropagation(); if (!layer.locked) removeLayer(layer.id); }}><Trash2 size={12} /></button>
            </div>
          ))}
          {selected && (
            <div className="arms-fields">
              <label>Название <input value={selected.name} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, name: event.target.value } : item) }), false)} /></label>
              <label>X <input type="number" value={Math.round(selected.x)} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, x: +event.target.value } : item) }))} /></label>
              <label>Y <input type="number" value={Math.round(selected.y)} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, y: +event.target.value } : item) }))} /></label>
              <label>W <input type="number" value={Math.round(selected.width)} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, width: +event.target.value } : item) }))} /></label>
              <label>H <input type="number" value={Math.round(selected.height)} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, height: +event.target.value } : item) }))} /></label>
              <label>Поворот <input type="number" value={Math.round(selected.rotation)} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, rotation: +event.target.value } : item) }))} /></label>
              <label>Прозрачность <input type="range" min={0} max={1} step={0.05} value={selected.opacity} onChange={(event) => updateDoc((document) => ({ ...document, layers: document.layers.map((item) => item.id === selected.id ? { ...item, opacity: +event.target.value } : item) }), false)} /></label>
              <button className="btn ghost" onClick={() => duplicate(selected)}><Copy size={14} /> Duplicate</button>
              <button className="btn ghost" onClick={() => moveLayer(selected.id, "up")}>Выше</button>
              <button className="btn ghost" onClick={() => moveLayer(selected.id, "down")}>Ниже</button>
              <button className="btn ghost" onClick={() => moveLayer(selected.id, "top")}>Наверх</button>
              <button className="btn ghost" onClick={() => moveLayer(selected.id, "bottom")}>Назад</button>
            </div>
          )}
          {!selected && (
            <div className="arms-fields">
              <label>Форма щита
                <select value={draft.document.shield.shape} onChange={(event) => updateDoc((document) => ({ ...document, shield: { ...document.shield, shape: event.target.value as ShieldShape } }))}>
                  {SHAPES.map((shape) => <option key={shape.id} value={shape.id}>{shape.label}</option>)}
                </select>
              </label>
              <label>Деление
                <select value={draft.document.division.kind} onChange={(event) => updateDoc((document) => ({ ...document, division: { ...document.division, kind: event.target.value as DivisionKind } }))}>
                  {DIVISIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <p className="form-section-label">Цвет поля</p>
              <ColorPicker value={draft.document.field.colorId} onChange={(id) => {
                updateDoc((document) => ({ ...document, field: { ...document.field, colorId: id, color: colorById(id).hex } }));
              }} />
              <p className="form-section-label">Второй цвет</p>
              <ColorPicker value={draft.document.division.colorId} onChange={(id) => updateDoc((document) => ({ ...document, division: { ...document.division, colorId: id, color: colorById(id).hex } }))} />
              <label>Девиз <input value={draft.motto} onChange={(event) => setDraft({ ...draft, motto: event.target.value })} /></label>
            </div>
          )}
        </aside>
      </div>
      <div className="herald-tools">
        <span className="quiet">Перемещение · resize за угол · Delete · ⌘Z / ⌘⇧Z · ⌘D</span>
      </div>
    </div>
  );
}

function Division({ document }: { document: HeraldryDocument }) {
  const { kind, color } = document.division;
  if (kind === "plain") return null;
  if (kind === "per_pale") return <rect x={DOC_WIDTH / 2} y={0} width={DOC_WIDTH / 2} height={DOC_HEIGHT} fill={color} />;
  if (kind === "per_fess") return <rect x={0} y={DOC_HEIGHT / 2} width={DOC_WIDTH} height={DOC_HEIGHT / 2} fill={color} />;
  if (kind === "per_bend") return <path d={`M0 0 L${DOC_WIDTH} ${DOC_HEIGHT} L${DOC_WIDTH} 0 Z`} fill={color} />;
  if (kind === "quarterly") {
    return (
      <>
        <rect x={DOC_WIDTH / 2} y={0} width={DOC_WIDTH / 2} height={DOC_HEIGHT / 2} fill={color} />
        <rect x={0} y={DOC_HEIGHT / 2} width={DOC_WIDTH / 2} height={DOC_HEIGHT / 2} fill={color} />
      </>
    );
  }
  return <path d={`M0 780 L500 430 L1000 780 L1000 1200 L0 1200 Z`} fill={color} />;
}

function AssetNode({
  layer,
  selected,
  onSelect,
  onChange,
  onCommit,
}: {
  layer: HeraldryLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<HeraldryLayer>) => void;
  onCommit: () => void;
}) {
  const start = useRef<{ x: number; y: number; lx: number; ly: number; w: number; h: number; mode: "move" | "resize" | "rotate" } | null>(null);
  const asset = assetById(layer.assetId);
  const onPointerDown = (event: React.PointerEvent, mode: "move" | "resize" | "rotate") => {
    if (layer.locked) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, y: event.clientY, lx: layer.x, ly: layer.y, w: layer.width, h: layer.height, mode };
    onSelect();
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!start.current) return;
    const dx = (event.clientX - start.current.x) * 2.2;
    const dy = (event.clientY - start.current.y) * 2.2;
    if (start.current.mode === "move") onChange({ x: start.current.lx + dx, y: start.current.ly + dy });
    if (start.current.mode === "resize") {
      const keep = event.shiftKey;
      const width = Math.max(40, start.current.w + dx);
      const height = keep ? width : Math.max(40, start.current.h + dy);
      onChange({ width, height });
    }
    if (start.current.mode === "rotate") {
      const angle = Math.atan2(event.clientY - start.current.y, event.clientX - start.current.x) * (180 / Math.PI);
      const snapped = event.shiftKey ? Math.round(angle / 15) * 15 : angle;
      onChange({ rotation: snapped });
    }
  };
  const onPointerUp = () => {
    if (start.current) onCommit();
    start.current = null;
  };

  return (
    <g
      transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation} ${layer.width / 2} ${layer.height / 2})`}
      opacity={layer.opacity}
      onPointerDown={(event) => onPointerDown(event, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: layer.locked ? "default" : "move" }}
    >
      {layer.imageData ? (
        <image href={layer.imageData} width={layer.width} height={layer.height} preserveAspectRatio="xMidYMid meet" />
      ) : layer.svgMarkup ? (
        <foreignObject width={layer.width} height={layer.height}>
          <div dangerouslySetInnerHTML={{ __html: layer.svgMarkup }} style={{ width: "100%", height: "100%" }} />
        </foreignObject>
      ) : (
        <svg viewBox="0 0 200 200" width={layer.width} height={layer.height}>
          <path d={asset?.path || ""} fill={layer.color || "#F4EAD4"} stroke="#2b251f" strokeWidth="4" />
        </svg>
      )}
      {selected && !layer.locked && (
        <>
          <rect className="handle" x={layer.width - 14} y={layer.height - 14} width={14} height={14} onPointerDown={(event) => onPointerDown(event, "resize")} />
          <rect className="handle" x={layer.width / 2 - 7} y={-28} width={14} height={14} onPointerDown={(event) => onPointerDown(event, "rotate")} />
        </>
      )}
    </g>
  );
}

