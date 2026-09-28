"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  className = "modal-card",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className={className} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
