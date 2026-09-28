"use client";

import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

export function AssignUnknownDialog({
  open,
  placeholderId,
  onClose,
}: {
  open: boolean;
  placeholderId: string;
  onClose: () => void;
}) {
  const { state, assignUnknown, notify } = useStore();
  const placeholder = state.people.find((person) => person.id === placeholderId);

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Указать человека</h2>
      <p className="quiet">Заменить карточку «{placeholder?.name || "Неизвестный"}» существующим человеком.</p>
      <div className="group-member-picker">
        {state.people
          .filter((person) => !person.isPlaceholder && person.id !== placeholderId)
          .map((person) => (
            <button
              key={person.id}
              type="button"
              className="people-row"
              onClick={() => {
                assignUnknown(placeholderId, person.id);
                notify("Карточка сохранена");
                onClose();
              }}
            >
              {person.name}
            </button>
          ))}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>Отмена</button>
      </div>
    </Modal>
  );
}
