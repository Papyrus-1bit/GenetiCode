"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { useStore } from "@/lib/store";
import { DEFAULT_GROUP_COLOR_ID } from "@/lib/palette";
import type { GroupKind } from "@/lib/types";

export function GroupEditor({ open, groupId, onClose }: { open: boolean; groupId?: string; onClose: () => void }) {
  const { state, ui, saveGroup, deleteGroup, notify } = useStore();
  const existing = state.groups.find((group) => group.id === groupId);
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupKind>("surname");
  const [colorId, setColorId] = useState(DEFAULT_GROUP_COLOR_ID);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name || "");
    setType(existing?.type || "surname");
    setColorId(existing?.groupColorId || DEFAULT_GROUP_COLOR_ID);
    setMemberIds(existing?.member_ids || [...ui.selectedIds]);
  }, [open, existing, ui.selectedIds]);

  return (
    <Modal open={open} onClose={onClose} className="modal-card group-dialog">
      <h2>{existing ? "Изменить группу" : "Создать цветную группу"}</h2>
      <p className="quiet">Объедините людей по фамилии или в семейство. Цвет появится снизу каждой карточки.</p>
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          saveGroup({ id: existing?.id, name: name.trim(), type, groupColorId: colorId, member_ids: memberIds });
          notify(existing ? "Группа обновлена" : "Группа создана");
          onClose();
        }}
      >
        <label>
          Название
          <input required value={name} placeholder="Например, Сивченковы" onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Тип
          <select value={type} onChange={(event) => setType(event.target.value as GroupKind)}>
            <option value="surname">Фамилия</option>
            <option value="family">Семейство</option>
          </select>
        </label>
        <div>
          <p className="form-section-label">Цвет</p>
          <ColorPicker value={colorId} onChange={setColorId} />
        </div>
        <p className="form-section-label">УЧАСТНИКИ · {memberIds.length} ВЫБРАНО</p>
        <div className="group-member-picker">
          {state.people.filter((person) => !person.isPlaceholder).map((person) => (
            <label key={person.id}>
              <input
                type="checkbox"
                checked={memberIds.includes(person.id)}
                onChange={(event) =>
                  setMemberIds(event.target.checked ? [...memberIds, person.id] : memberIds.filter((id) => id !== person.id))
                }
              />
              <span>{person.name}</span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          {existing && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                if (confirm(`Удалить группу «${existing.name}»? Карточки людей останутся.`)) {
                  deleteGroup(existing.id);
                  notify("Группа удалена");
                  onClose();
                }
              }}
            >
              Удалить
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn" type="submit">Сохранить группу</button>
        </div>
      </form>
    </Modal>
  );
}
