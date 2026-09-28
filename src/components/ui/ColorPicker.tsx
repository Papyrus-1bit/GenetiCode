"use client";

import { PALETTE, colorById } from "@/lib/palette";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = colorById(value);
  return (
    <div className="palette-grid" role="listbox" aria-label="Цвет группы">
      {PALETTE.map((color) => (
        <button
          key={color.id}
          type="button"
          className="palette-swatch"
          style={{ background: color.hex }}
          aria-label={color.name}
          aria-selected={color.id === selected.id}
          title={color.name}
          onClick={() => onChange(color.id)}
        />
      ))}
    </div>
  );
}
