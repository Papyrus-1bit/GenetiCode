"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, LocateFixed } from "lucide-react";
import { useStore } from "@/lib/store";
import { CARD_SIZE, MINI_ZOOM_THRESHOLD, SELF_ID, type ConnectorSide } from "@/lib/types";
import { connectorPoint } from "@/lib/geometry";
import { isTypingTarget } from "@/lib/id";
import { PersonCard } from "./PersonCard";
import { ConnectionsLayer } from "./ConnectionsLayer";

interface Camera {
  scale: number;
  tx: number;
  ty: number;
}

interface Drag {
  kind: "pan" | "node" | "link";
  pointerId: number;
  x: number;
  y: number;
  ids?: string[];
  fromId?: string;
  side?: ConnectorSide;
}

export function FamilyCanvas({
  onRequestLink,
  onAssignUnknown,
  centerRequest,
}: {
  onRequestLink: (fromId: string, toId: string) => void;
  onAssignUnknown: (id: string) => void;
  centerRequest: { id: string; nonce: number } | null;
}) {
  const { state, ui, select, movePeople, setUi } = useStore();
  const viewport = useRef<HTMLDivElement>(null);
  const space = useRef(false);
  const drag = useRef<Drag | null>(null);
  const cameraRef = useRef<Camera>({ scale: 1, tx: 80, ty: 40 });
  const [camera, setCamera] = useState<Camera>({ scale: 1, tx: 80, ty: 40 });
  const [preview, setPreview] = useState<string | null>(null);
  const effectiveMode = camera.scale <= MINI_ZOOM_THRESHOLD ? "compact" : ui.cardMode;

  const commitCamera = useCallback((next: Camera | ((current: Camera) => Camera)) => {
    setCamera((current) => {
      const value = typeof next === "function" ? next(current) : next;
      cameraRef.current = value;
      return value;
    });
  }, []);

  const centerOn = useCallback(
    (id = SELF_ID) => {
      const box = viewport.current?.getBoundingClientRect();
      const person = state.people.find((item) => item.id === id);
      const size = CARD_SIZE[effectiveMode];
      if (!box || !person) return;
      commitCamera((current) => ({
        ...current,
        tx: box.width * 0.48 - (person.x + size.w / 2) * current.scale,
        ty: box.height * 0.57 - (person.y + size.h / 2) * current.scale,
      }));
    },
    [commitCamera, effectiveMode, state.people],
  );

  const didCenter = useRef(false);
  useEffect(() => {
    if (!ui.loaded || didCenter.current) return;
    didCenter.current = true;
    centerOn(SELF_ID);
  }, [ui.loaded, centerOn]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const handle = (event: WheelEvent) => {
      event.preventDefault();
      const box = node.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      commitCamera((current) => {
        const factor = Math.exp(-event.deltaY * 0.0015);
        const scale = Math.max(0.25, Math.min(2.5, current.scale * factor));
        return {
          scale,
          tx: x - ((x - current.tx) * scale) / current.scale,
          ty: y - ((y - current.ty) * scale) / current.scale,
        };
      });
    };
    node.addEventListener("wheel", handle, { passive: false });
    return () => node.removeEventListener("wheel", handle);
  }, [commitCamera]);

  useEffect(() => {
    if (!centerRequest) return;
    centerOn(centerRequest.id);
  }, [centerRequest, centerOn]);

  const bumpZoom = useCallback(
    (delta: number) => {
      const box = viewport.current?.getBoundingClientRect();
      if (!box) return;
      commitCamera((current) => {
        const scale = Math.max(0.25, Math.min(2.5, +(current.scale + delta).toFixed(2)));
        const cx = box.width / 2;
        const cy = box.height / 2;
        return {
          scale,
          tx: cx - ((cx - current.tx) * scale) / current.scale,
          ty: cy - ((cy - current.ty) * scale) / current.scale,
        };
      });
    },
    [commitCamera],
  );

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.code === "Space") {
        space.current = true;
        event.preventDefault();
      }
      if (event.key === "Escape") select([]);
      if (event.key === "+" || event.key === "=") bumpZoom(0.13);
      if (event.key === "-") bumpZoom(-0.13);
      if (event.key === "0") centerOn();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [bumpZoom, centerOn, select]);


  const onCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("button,input,label,select") && event.button !== 1 && !space.current) {
      return;
    }
    if (event.button === 1 || space.current || event.button === 0) {
      if (event.button === 0 && !space.current && event.target === event.currentTarget) {
        select([]);
      }
      if (event.button === 1 || space.current) {
        drag.current = { kind: "pan", pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  };

  const onNodePointerDown = (event: React.PointerEvent, id: string) => {
    event.stopPropagation();
    const additive = ui.multiMode || event.shiftKey || event.metaKey || event.ctrlKey;
    if (event.button === 1 || space.current) {
      drag.current = { kind: "pan", pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    } else {
      const ids = ui.selectedIds.includes(id) && ui.selectedIds.length > 1 ? [...ui.selectedIds] : [id];
      if (additive) select([id], true);
      else if (!ui.selectedIds.includes(id)) select(ids);
      drag.current = {
        kind: "node",
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        ids: ui.selectedIds.includes(id) && ui.selectedIds.length > 1 ? [...ui.selectedIds] : [id],
      };
    }
    viewport.current?.setPointerCapture(event.pointerId);
  };

  const onConnectStart = (event: React.PointerEvent, id: string, side: ConnectorSide) => {
    drag.current = { kind: "link", pointerId: event.pointerId, x: event.clientX, y: event.clientY, fromId: id, side };
    viewport.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.kind === "pan") {
      commitCamera((camera) => ({ ...camera, tx: camera.tx + dx, ty: camera.ty + dy }));
      current.x = event.clientX;
      current.y = event.clientY;
      return;
    }
    if (current.kind === "node" && current.ids) {
      const scale = cameraRef.current.scale;
      movePeople(current.ids, dx / scale, dy / scale);
      current.x = event.clientX;
      current.y = event.clientY;
      return;
    }
    if (current.kind === "link" && current.fromId && current.side) {
      const from = state.people.find((person) => person.id === current.fromId);
      if (!from) return;
      const start = connectorPoint(from, current.side, effectiveMode);
      const box = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - box.left - cameraRef.current.tx) / cameraRef.current.scale;
      const y = (event.clientY - box.top - cameraRef.current.ty) / cameraRef.current.scale;
      setPreview(`M ${start.x} ${start.y} L ${x} ${y}`);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.kind === "link" && current.fromId) {
      const box = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - box.left - cameraRef.current.tx) / cameraRef.current.scale;
      const y = (event.clientY - box.top - cameraRef.current.ty) / cameraRef.current.scale;
      const size = CARD_SIZE[effectiveMode];
      const hit = state.people.find(
        (person) => x >= person.x && x <= person.x + size.w && y >= person.y && y <= person.y + size.h && person.id !== current.fromId,
      );
      if (hit) onRequestLink(current.fromId, hit.id);
    }
    drag.current = null;
    setPreview(null);
  };

  const originId = ui.selectedIds[0] || SELF_ID;
  const people = useMemo(() => state.people, [state.people]);

  return (
    <div
      ref={viewport}
      className={`canvas-viewport ${space.current ? "is-panning" : ""}`}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="canvas-grid" />
      <div className="graph-stage" style={{ transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})` }}>
        <ConnectionsLayer state={state} mode={effectiveMode} hoverId={null} preview={preview} />
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            state={state}
            mode={effectiveMode}
            selected={ui.selectedIds.includes(person.id)}
            multi={ui.multiMode && ui.selectedIds.includes(person.id)}
            originId={originId}
            onPointerDown={onNodePointerDown}
            onClick={(event, id) => {
              const personCard = state.people.find((item) => item.id === id);
              if (personCard?.isPlaceholder) onAssignUnknown(id);
              if (event.shiftKey || ui.multiMode) return;
            }}
            onConnectStart={onConnectStart}
          />
        ))}
      </div>
      <div className="canvas-hint">
        Тяните поле / Space · колесо — масштаб
      </div>
      <div className="canvas-controls" aria-label="Масштаб дерева">
        <button type="button" title="Увеличить" aria-label="Увеличить" onClick={() => bumpZoom(0.13)}>
          <Plus size={19} />
        </button>
        <span>{Math.round(camera.scale * 100)}%</span>
        <button type="button" title="Уменьшить" aria-label="Уменьшить" onClick={() => bumpZoom(-0.13)}>
          <Minus size={19} />
        </button>
        <button type="button" title="Вернуться к себе" aria-label="Найти себя" onClick={() => centerOn()}>
          <LocateFixed size={19} />
        </button>
        <button type="button" title="Сбросить масштаб" aria-label="Сбросить масштаб" onClick={() => { commitCamera({ scale: 1, tx: camera.tx, ty: camera.ty }); centerOn(); }}>
          0
        </button>
      </div>
    </div>
  );
}
