"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import type { Gender, Person } from "@/lib/types";

export function PersonEditor({
  open,
  person,
  onClose,
}: {
  open: boolean;
  person: Person | null;
  onClose: () => void;
}) {
  const { savePerson, selected } = useStore();
  const [form, setForm] = useState({
    name: "",
    gender: "unknown" as Gender,
    born: "",
    birth_place: "",
    is_deceased: false,
    died: "",
    death_place: "",
    note: "",
    relatedId: "",
    relation: "parent" as "parent" | "child" | "partner" | "sibling",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: person?.name || "",
      gender: person?.gender || "unknown",
      born: person?.born || "",
      birth_place: person?.birth_place || person?.place || "",
      is_deceased: Boolean(person?.is_deceased || person?.died),
      died: person?.died || "",
      death_place: person?.death_place || "",
      note: person?.note || "",
      relatedId: person ? "" : selected?.id || "",
      relation: "parent",
    });
  }, [open, person, selected?.id]);

  return (
    <Modal open={open} onClose={onClose}>
      <p className="eyebrow">КАРТОЧКА ЧЕЛОВЕКА</p>
      <h2>{person ? "Изменить карточку" : "Добавить человека"}</h2>
      <p className="quiet">Укажите то, что известно. Спорные даты можно уточнить позже.</p>
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          savePerson(
            {
              id: person?.id,
              name: form.name.trim(),
              gender: form.gender,
              born: form.born,
              birth_place: form.birth_place,
              place: form.birth_place,
              is_deceased: form.is_deceased,
              died: form.died,
              death_place: form.death_place,
              note: form.note,
            },
            !person && form.relatedId ? { relatedId: form.relatedId, role: form.relation } : undefined,
          );
          onClose();
        }}
      >
        <label>
          Имя и фамилия
          <input required value={form.name} placeholder="Например, Иван Петрович Сивченков" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          Пол
          <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}>
            <option value="unknown">Не указан</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </label>
        <div className="form-columns">
          <label>
            Дата рождения
            <input value={form.born} placeholder="28.03.2001 или 1904" onChange={(event) => setForm({ ...form, born: event.target.value })} />
          </label>
          <label>
            Место рождения
            <input value={form.birth_place} placeholder="Населённый пункт, область" onChange={(event) => setForm({ ...form, birth_place: event.target.value })} />
          </label>
        </div>
        <label className="deceased-toggle">
          <input type="checkbox" checked={form.is_deceased} onChange={(event) => setForm({ ...form, is_deceased: event.target.checked })} />
          <span>
            <b>Человек умер</b>
            <small>Можно отметить, даже если дата неизвестна</small>
          </span>
        </label>
        {form.is_deceased && (
          <div className="form-columns">
            <label>
              Дата смерти
              <input value={form.died} placeholder="Можно оставить пустой" onChange={(event) => setForm({ ...form, died: event.target.value })} />
            </label>
            <label>
              Место смерти
              <input value={form.death_place} placeholder="Если известно" onChange={(event) => setForm({ ...form, death_place: event.target.value })} />
            </label>
          </div>
        )}
        <label>
          Что нужно проверить
          <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
        {!person && (
          <>
            <p className="form-section-label">СВЯЗЬ В ДЕРЕВЕ</p>
            <label>
              Связать с
              <RelatedSelect value={form.relatedId} onChange={(relatedId) => setForm({ ...form, relatedId })} />
            </label>
            {form.relatedId && (
              <label>
                Новый человек приходится ему/ей
                <select value={form.relation} onChange={(event) => setForm({ ...form, relation: event.target.value as typeof form.relation })}>
                  <option value="parent">Родителем</option>
                  <option value="child">Ребёнком</option>
                  <option value="partner">Партнёром</option>
                  <option value="sibling">Брат / сестра</option>
                </select>
              </label>
            )}
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn" type="submit">Сохранить</button>
        </div>
      </form>
    </Modal>
  );
}

function RelatedSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { state } = useStore();
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Пока без связи</option>
      {state.people.filter((person) => !person.isPlaceholder).map((person) => (
        <option key={person.id} value={person.id}>{person.name}</option>
      ))}
    </select>
  );
}
