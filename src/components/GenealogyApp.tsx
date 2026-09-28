"use client";

import { useState } from "react";
import {
  Check,
  Menu,
  Plus,
  Search,
  Shield,
  Users,
  UsersRound,
  BookOpen,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { generationsLabel } from "@/lib/age";
import { generationYs } from "@/lib/geometry";
import { FamilyCanvas } from "@/components/canvas/FamilyCanvas";
import { SidePanel } from "@/components/panels/SidePanel";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { PersonEditor } from "@/components/dialogs/PersonEditor";
import { GroupEditor } from "@/components/dialogs/GroupEditor";
import { LinkDialog } from "@/components/dialogs/LinkDialog";
import { AssignUnknownDialog } from "@/components/dialogs/AssignUnknownDialog";
import { HeraldryEditor } from "@/components/heraldry/HeraldryEditor";
import { CoatPreview } from "@/components/heraldry/CoatPreview";
import { Tooltip } from "@/components/ui/Tooltip";
import { emptyArms } from "@/lib/heraldry/migrate";
import type { CoatOfArms, Person } from "@/lib/types";

export function GenealogyApp() {
  const { state, ui, setUi, setTitle, saveArms, notify } = useStore();
  const [personOpen, setPersonOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupId, setGroupId] = useState<string | undefined>();
  const [link, setLink] = useState<{ fromId: string; toId: string } | null>(null);
  const [unknownId, setUnknownId] = useState<string | null>(null);
  const [armsOpen, setArmsOpen] = useState(false);
  const [armsDraft, setArmsDraft] = useState<CoatOfArms | null>(null);
  const [center, setCenter] = useState<{ id: string; nonce: number } | null>(null);
  const gens = generationYs(state.people).length;

  const togglePanel = (id: typeof ui.leftPanel) => {
    setUi({ leftPanel: ui.leftPanel === id ? null : id });
  };

  if (!ui.loaded) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark">Р</span>
            <span className="brand-title">Родословная</span>
          </div>
          <span>Загрузка...</span>
        </header>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Tooltip label="Главное меню">
          <button type="button" className="tool-btn" aria-label="Главное меню" onClick={() => togglePanel("people")}>
            <Menu size={18} />
          </button>
        </Tooltip>
        <div className="brand">
          <span className="brand-mark" aria-hidden>Р</span>
          <span className="brand-title">
            Родословная
            <small>Семейный архив</small>
          </span>
        </div>
        <input
          className="tree-title-input"
          aria-label="Название дерева"
          value={state.settings.tree_title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => notify("Название сохранено")}
        />
        <span className="private-tag">Личное дерево</span>
        <div className="header-tools">
          <div className="card-mode" aria-label="Вид карточек">
            <button type="button" className={ui.cardMode === "compact" ? "active" : ""} onClick={() => setUi({ cardMode: "compact" })}>Мини</button>
            <button type="button" className={ui.cardMode === "standard" ? "active" : ""} onClick={() => setUi({ cardMode: "standard" })}>Стандарт</button>
          </div>
          <button
            type="button"
            className={`multi-select-toggle ${ui.multiMode ? "active" : ""}`}
            onClick={() => setUi({ multiMode: !ui.multiMode })}
          >
            Выделить
          </button>
          <Tooltip label="Гербы">
            <button type="button" className="btn ghost arms-open" aria-label="Гербы" onClick={() => { setArmsDraft(state.arms[0] || emptyArms()); setArmsOpen(true); }}>
              <Shield size={16} /> Гербы
            </button>
          </Tooltip>
          <button type="button" className="btn main-add" onClick={() => { setEditing(null); setPersonOpen(true); }}>
            <Plus size={16} /> Добавить человека
          </button>
          <span className="save-state">{ui.saving ? "Сохраняю…" : <><Check size={14} /> Сохранено</>}</span>
        </div>
      </header>
      <div className="workspace">
        <div className="tree-area">
          <FamilyCanvas
            centerRequest={center}
            onRequestLink={(fromId, toId) => setLink({ fromId, toId })}
            onAssignUnknown={(id) => setUnknownId(id)}
          />
          <nav className="icon-rail" aria-label="Панели">
            <Tooltip label="Люди">
              <button type="button" className={ui.leftPanel === "people" ? "active" : ""} aria-label="Люди" onClick={() => togglePanel("people")}><Users size={18} /></button>
            </Tooltip>
            <Tooltip label="Группы">
              <button type="button" className={ui.leftPanel === "groups" ? "active" : ""} aria-label="Группы" onClick={() => togglePanel("groups")}><UsersRound size={18} /></button>
            </Tooltip>
            <Tooltip label="Источники">
              <button type="button" className={ui.leftPanel === "sources" ? "active" : ""} aria-label="Источники" onClick={() => togglePanel("sources")}><BookOpen size={18} /></button>
            </Tooltip>
            <Tooltip label="Поиск">
              <button type="button" className={ui.leftPanel === "search" ? "active" : ""} aria-label="Поиск" onClick={() => togglePanel("search")}><Search size={18} /></button>
            </Tooltip>
          </nav>
          <SidePanel
            onCenter={(id) => setCenter({ id, nonce: Date.now() })}
            onEditGroup={(id) => { setGroupId(id); setGroupOpen(true); }}
          />
          <InspectorPanel
            onEdit={() => { setEditing(state.people.find((person) => person.id === ui.selectedIds[0]) || null); setPersonOpen(true); }}
            onAssign={(id) => setUnknownId(id)}
          />
          <div className="bottom-tools">
            <span className="eyebrow">ДЕРЕВО · {gens} {generationsLabel(gens)}</span>
            <span className="tree-count">{state.people.filter((person) => !person.isPlaceholder).length} человек</span>
          </div>
        </div>
      </div>
      {ui.toast && <div className={`global-message ${ui.toast.error ? "error" : ""}`}>{ui.toast.text}</div>}
      <PersonEditor open={personOpen} person={editing} onClose={() => setPersonOpen(false)} />
      <GroupEditor open={groupOpen} groupId={groupId} onClose={() => setGroupOpen(false)} />
      {link && (
        <LinkDialog open={Boolean(link)} fromId={link.fromId} toId={link.toId} onClose={() => setLink(null)} />
      )}
      {unknownId && (
        <AssignUnknownDialog open={Boolean(unknownId)} placeholderId={unknownId} onClose={() => setUnknownId(null)} />
      )}
      <HeraldryEditor
        open={armsOpen}
        initial={armsDraft}
        onClose={() => setArmsOpen(false)}
        onSave={(arms) => { saveArms(arms); notify(arms.id ? "Герб обновлён" : "Герб сохранён"); }}
      />
      {state.arms.length > 0 && armsOpen === false && (
        <div style={{ display: "none" }}>
          <CoatPreview value={state.arms[0]} small />
        </div>
      )}
    </div>
  );
}
