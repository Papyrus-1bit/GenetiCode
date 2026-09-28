"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import type { PairStatus } from "@/lib/types";

export function LinkDialog({
  open,
  fromId,
  toId,
  onClose,
}: {
  open: boolean;
  fromId: string;
  toId: string;
  onClose: () => void;
}) {
  const { state, linkPeople, notify } = useStore();
  const from = state.people.find((person) => person.id === fromId);
  const to = state.people.find((person) => person.id === toId);
  const [role, setRole] = useState<"parent" | "child" | "partner" | "sibling">("parent");
  const [status, setStatus] = useState<PairStatus>("unspecified");
  if (!from || !to) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Связать людей</h2>
      <p className="quiet">
        Укажите связь для «{from.name}»
      </p>
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          linkPeople(fromId, toId, role, status);
          notify("Связь добавлена");
          onClose();
        }}
      >
        <label>
          Другой человек
          <input readOnly value={to.name} />
        </label>
        <label>
          Его/её роль
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            <option value="parent">Родитель выбранного</option>
            <option value="child">Ребёнок выбранного</option>
            <option value="partner">Партнёр выбранного</option>
            <option value="sibling">Брат / сестра выбранного</option>
          </select>
        </label>
        {role === "partner" && (
          <label>
            Статус пары
            <select value={status} onChange={(event) => setStatus(event.target.value as PairStatus)}>
              <option value="unspecified">Пока не указан</option>
              <option value="engaged">Помолвлены</option>
              <option value="married">Женаты</option>
              <option value="divorced">Разведены</option>
            </select>
          </label>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn" type="submit">Связать</button>
        </div>
      </form>
    </Modal>
  );
}
