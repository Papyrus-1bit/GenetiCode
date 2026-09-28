"use client";

import { Camera, Trash2, Pencil, Unlink, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatAge, isDeceased } from "@/lib/age";
import { initials } from "@/lib/id";
import { kinLabel } from "@/lib/kin";
import { PHOTO_LIMIT_BYTES, SELF_ID } from "@/lib/types";
import { colorById } from "@/lib/palette";

export function InspectorPanel({
  onEdit,
  onAssign,
}: {
  onEdit: () => void;
  onAssign: (id: string) => void;
}) {
  const { state, ui, selected, unlink, setPairStatus, setPrimaryGroup, savePhoto, clearPhoto, deletePerson, notify, setUi } = useStore();
  if (!ui.inspectorOpen || !selected) return null;
  const relations = state.edges.filter((edge) => edge.from_id === selected.id || edge.to_id === selected.id);
  const groups = state.groups.filter((group) => group.member_ids.includes(selected.id));
  const photo = selected.photo_data || state.photos[selected.id];

  return (
    <aside className="floating-panel inspector-panel">
      <header>
        Карточка
        <button type="button" className="tool-btn" aria-label="Закрыть" onClick={() => setUi({ inspectorOpen: false })}>
          <X size={16} />
        </button>
      </header>
      <div className="panel-scroll person-content">
        <div className="person-detail">
          <div className={`detail-avatar ${selected.id === SELF_ID ? "self" : ""}`}>
            {photo ? <img src={photo} alt="" /> : initials(selected.name)}
          </div>
          <h2>{selected.name}</h2>
          {selected.isPlaceholder ? (
            <button className="btn" onClick={() => onAssign(selected.id)}>Указать человека</button>
          ) : (
            <>
              <div className="photo-actions">
                <label>
                  <Camera size={14} /> Добавить фото
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > PHOTO_LIMIT_BYTES) {
                        notify("Не удалось загрузить фотографию", true);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => savePhoto(selected.id, String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {photo && (
                  <button type="button" onClick={() => { clearPhoto(selected.id); notify("Фотография удалена"); }}>
                    Удалить
                  </button>
                )}
              </div>
              <p className="eyebrow">КАРТОЧКА ЧЕЛОВЕКА</p>
              <dl>
                <div><dt>Родство</dt><dd>{kinLabel(selected.id, selected, state)}</dd></div>
                <div><dt>Возраст</dt><dd>{formatAge(selected)}</dd></div>
                <div><dt>Рождение</dt><dd>{selected.born || "Нет сведений"}</dd></div>
                <div><dt>Место рождения</dt><dd>{selected.birth_place || selected.place || "Нет сведений"}</dd></div>
                {isDeceased(selected) && (
                  <>
                    <div><dt>Смерть</dt><dd>{selected.died || "Дата неизвестна"}</dd></div>
                    <div><dt>Место смерти</dt><dd>{selected.death_place || "Нет сведений"}</dd></div>
                  </>
                )}
                {selected.note && <div><dt>Заметка</dt><dd>{selected.note}</dd></div>}
              </dl>
              <div className="detail-buttons">
                <button className="btn ghost" onClick={onEdit}><Pencil size={14} /> Изменить</button>
              </div>
            </>
          )}
        </div>
        {groups.length > 0 && (
          <div className="person-detail">
            <p className="eyebrow">Группы</p>
            <div className="person-group-chips">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="group-chip"
                  style={{ borderColor: colorById(group.groupColorId).hex }}
                  onClick={() => setPrimaryGroup(selected.id, group.id)}
                >
                  <i style={{ background: colorById(group.groupColorId).hex }} />
                  {group.name}
                  {selected.primaryGroupId === group.id ? " · основная" : ""}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="relations">
          <p className="eyebrow">Связи {relations.length}</p>
          {relations.length === 0 && <p className="quiet">Связей ещё нет.</p>}
          {relations.map((edge) => {
            const otherId = edge.from_id === selected.id ? edge.to_id : edge.from_id;
            const other = state.people.find((person) => person.id === otherId);
            if (!other) return null;
            return (
              <div key={edge.id} className="people-row">
                <strong>{other.name}</strong>
                <small>{kinLabel(selected.id, other, state)}</small>
                {edge.type === "partner" && (
                  <select
                    className="relation-status"
                    aria-label={`Статус пары с ${other.name}`}
                    value={edge.relationship_status}
                    onChange={(event) => {
                      setPairStatus(edge.id, event.target.value as typeof edge.relationship_status);
                      notify("Статус пары сохранён");
                    }}
                  >
                    <option value="unspecified">Пока не указан</option>
                    <option value="engaged">Помолвлены</option>
                    <option value="married">Женаты</option>
                    <option value="divorced">Разведены</option>
                  </select>
                )}
                <button type="button" className="relation-remove" title={`Убрать связь с ${other.name}`} onClick={() => { unlink(edge.id); notify("Связь удалена"); }}>
                  <Unlink size={15} />
                </button>
              </div>
            );
          })}
        </div>
        {!selected.isPlaceholder && (
          <button
            type="button"
            className="delete-person"
            onClick={() => {
              if (confirm(`Удалить карточку «${selected.name}» и его/её связи?`)) {
                deletePerson(selected.id);
                notify("Карточка удалена");
              }
            }}
          >
            <Trash2 size={14} /> Удалить карточку
          </button>
        )}
      </div>
    </aside>
  );
}
