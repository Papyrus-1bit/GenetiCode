"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { SEARCH_SOURCES } from "@/lib/seed";
import { colorById } from "@/lib/palette";
import { formatAge } from "@/lib/age";

export function SidePanel({
  onCenter,
  onEditGroup,
}: {
  onCenter: (id: string) => void;
  onEditGroup: (id?: string) => void;
}) {
  const { state, ui, setUi, select, attachCandidate, addCandidatePerson, notify } = useStore();
  const [query, setQuery] = useState("");
  const [candFilter, setCandFilter] = useState<"all" | "new" | "saved" | "attached">("all");
  if (!ui.leftPanel) return null;

  const people = state.people.filter((person) =>
    person.name.toLowerCase().includes(query.toLowerCase()),
  );

  const candidates = state.candidates.filter((item) => candFilter === "all" || item.status === candFilter);

  return (
    <aside className="floating-panel">
      <header>
        {ui.leftPanel === "people" && "Люди"}
        {ui.leftPanel === "groups" && "Группы"}
        {ui.leftPanel === "sources" && "Источники"}
        {ui.leftPanel === "search" && "Поиск"}
        <button type="button" className="tool-btn" aria-label="Закрыть" onClick={() => setUi({ leftPanel: null })}>
          <X size={16} />
        </button>
      </header>
      <div className="panel-scroll">
        {ui.leftPanel === "people" && (
          <>
            <div className="search-block">
              <div className="search-input">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Фамилия или имя" />
              </div>
            </div>
            <div className="people-list">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="people-row"
                  onClick={() => {
                    select([person.id]);
                    onCenter(person.id);
                  }}
                >
                  <strong>{person.name}</strong>
                  <small>{person.isPlaceholder ? "Неизвестный" : formatAge(person)}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {ui.leftPanel === "groups" && (
          <div className="groups-panel">
            <p className="groups-intro">Фамилии и семейства</p>
            <button className="btn" onClick={() => onEditGroup()}>Создать</button>
            <div className="group-list" style={{ marginTop: 12 }}>
              {state.groups.length === 0 && <p className="quiet">Групп пока нет</p>}
              {state.groups.map((group) => (
                <article key={group.id} className="family-group-card">
                  <div className="group-card-title" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="group-swatch" style={{ background: colorById(group.groupColorId).hex }} />
                    <strong>{group.name}</strong>
                    <small>{group.type === "surname" ? "Фамилия" : "Семейство"} · {group.member_ids.length} чел.</small>
                  </div>
                  <div className="group-actions">
                    <button type="button" onClick={() => { select([...group.member_ids]); if (group.member_ids[0]) onCenter(group.member_ids[0]); }}>Выделить</button>
                    <button type="button" onClick={() => onEditGroup(group.id)}>Изменить</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        {ui.leftPanel === "search" && (
          <SearchPane />
        )}
        {ui.leftPanel === "sources" && (
          <>
            <div className="results-heading">
              <h2>Кандидаты <span>{candidates.length}</span></h2>
            </div>
            <div className="filter-row">
              {(["all", "new", "saved", "attached"] as const).map((key) => (
                <button key={key} type="button" className={candFilter === key ? "active" : ""} onClick={() => setCandFilter(key)}>
                  {key === "all" ? "Все" : key === "new" ? "Новые" : key === "saved" ? "Отложено" : "Привязано"}
                </button>
              ))}
            </div>
            <div className="candidate-list">
              {candidates.map((item) => (
                <article key={item.id} className="candidate-card">
                  <div className="candidate-top">
                    <small>{item.category}</small>
                    {item.status === "attached" && <span className="attached-chip">в дереве</span>}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <div className="candidate-place">{item.place}</div>
                  <div className="candidate-actions">
                    <button type="button" onClick={() => addCandidatePerson(item.id, ui.selectedIds[0])}>Создать карточку</button>
                    <button type="button" onClick={() => { attachCandidate(item.id, ui.selectedIds[0] || null, ui.selectedIds[0] ? "attached" : "saved"); notify(ui.selectedIds[0] ? "Упоминание прикреплено" : "Находка отложена"); }}>Сверить</button>
                    <a href={item.source_url} target="_blank" rel="noreferrer">Источник</a>
                  </div>
                </article>
              ))}
              {candidates.length === 0 && (
                <div className="empty-list">
                  <strong>Здесь пока пусто</strong>
                  <span>Измените фильтр или поищите другую фамилию.</span>
                </div>
              )}
            </div>
            <p className="panel-footnote">Записи из форума — зацепки. В дерево они не попадают по одной фамилии.</p>
          </>
        )}
      </div>
    </aside>
  );
}

function SearchPane() {
  const { state } = useStore();
  const [q, setQ] = useState("Сивченков");
  const hits = useMemo(
    () =>
      state.candidates.filter(
        (item) =>
          item.title.toLowerCase().includes(q.toLowerCase()) ||
          item.excerpt.toLowerCase().includes(q.toLowerCase()) ||
          item.query.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, state.candidates],
  );
  return (
    <div className="search-block">
      <p className="eyebrow">ПОИСК УПОМИНАНИЙ</p>
      <h2>Есть ли новые следы?</h2>
      <form className="search-form" onSubmit={(event) => event.preventDefault()}>
        <div className="search-input">
          <Search size={16} />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Фамилия или имя" />
        </div>
        <button className="btn search-button" type="submit">Искать</button>
      </form>
      <div className="search-result">
        <strong>{hits.length ? `Совпадений в архиве: ${hits.length}` : "Новых находок нет"}</strong>
        <span>Продолжите во внешних источниках</span>
        <div className="external-searches">
          <span>Источники · {SEARCH_SOURCES.length}</span>
          {SEARCH_SOURCES.map((source) => (
            <a key={source.id} href={source.url(q)} target="_blank" rel="noreferrer">{source.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
