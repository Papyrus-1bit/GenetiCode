"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pos) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 480);
    return () => window.clearTimeout(timer);
  }, [pos]);

  return (
    <span
      onMouseEnter={(event) => setPos({ x: event.clientX, y: event.clientY })}
      onMouseMove={(event) => setPos({ x: event.clientX, y: event.clientY })}
      onMouseLeave={() => setPos(null)}
      style={{ display: "inline-flex" }}
    >
      {children}
      {visible && pos && (
        <span className="ui-tooltip" style={{ left: pos.x + 12, top: pos.y + 14 }}>
          {label}
        </span>
      )}
    </span>
  );
}
