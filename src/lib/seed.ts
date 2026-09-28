import type { Candidate, Edge, GenealogyState, Person } from "./types";
import { SCHEMA_VERSION as VERSION } from "./types";

const CREATED = "2026-09-27";

function inferGender(name: string): Person["gender"] {
  if (/вна\b|чна\b|ская\b|ова\b|ева\b/i.test(name)) return "female";
  if (/ич\b|ский\b|ов\b|ев\b/i.test(name)) return "male";
  return "unknown";
}

function person(
  id: string,
  name: string,
  born: string,
  place: string,
  x: number,
  y: number,
  note = "",
  died = "",
): Person {
  return {
    id,
    name,
    born,
    died,
    place,
    birth_place: place,
    death_place: "",
    gender: inferGender(name),
    is_deceased: Boolean(died),
    note,
    x,
    y,
    status: "family",
    source_label: "Семейные сведения",
    photo_key: "",
    photo_data: "",
    created_at: CREATED,
    primaryGroupId: "",
    type: "person",
    isPlaceholder: false,
    familyContextId: "",
  };
}

function parentEdge(from: string, to: string): Edge {
  return {
    id: `e_${from}_${to}`,
    from_id: from,
    to_id: to,
    type: "parent",
    status: "family",
    relationship_status: "unspecified",
    color: "#9fc7c9",
  };
}

function candidate(
  id: string,
  title: string,
  excerpt: string,
  source_url: string,
  query: string,
  place: string,
  category = "Форум ВГД",
): Candidate {
  return {
    id,
    title,
    excerpt,
    source_url,
    query,
    place,
    category,
    source_name: "forum.vgd.ru",
    status: "new",
    linked_person_id: null,
    discovered_at: CREATED,
  };
}

export const SEED_PEOPLE: Person[] = [
  person("vova", "Владимир Александрович Сивченков", "28.03.2001", "Сафоново", 810, 770, "Вы"),
  person("alexander", "Александр Анатольевич Сивченков", "1960-е · дата уточняется", "Сафоново", 500, 520, "Отец"),
  person("natalya", "Наталья Владимировна Тарасова", "27.04.1977", "Сафоново", 1000, 520, "Мать"),
  person("sergey", "Сергей Валентинович Слизков", "12.05 · год уточняется", "Сафоново", 1350, 520, "Отчим"),
  person("sofia", "София Сергеевна Слизкова", "Год уточняется", "Смоленск", 1260, 770, "Сестра по матери; год рождения расходится в записях"),
  person("anatoly", "Анатолий Федотьевич Сивченков", "12.1938", "Сафоново", 310, 290, "Дед по отцу", "18.03.2018"),
  person("alexandra", "Александра Сивченкова", "", "Сафоново", 560, 290, "Бабушка по отцу; отчество требует уточнения"),
  person("vladimir_t", "Владимир Андреевич Тарасов", "23.07.1946", "Товарково, Тульская обл.", 900, 290, "Дед по матери", "15.03.1996"),
  person("valentina", "Валентина Петровна Тарасова (Парамонова)", "09.04.1950", "с. Узлив, Орловская обл. — по семейным сведениям", 1180, 290, "Бабушка по матери"),
  person("fedot", "Федот Кондратьевич Сивченков", "1904 · по семейной схеме", "", 170, 50, "Прадед; обстоятельства гибели требуют проверки", "12.1943 ?"),
  person("fekla", "Фёкла Сивченкова", "", "", 410, 50, "Прабабушка; фамилия и отчество требуют проверки"),
  person("andrey_t", "Андрей Андреевич Тарасов", "", "Тульская обл. · по семейной схеме", 760, 50, "Прадед"),
  person("anna_m", "Анна Васильевна Тарасова (Медведева)", "21.07.1913 · по семейной схеме", "", 1010, 50, "Прабабушка", "27.11.1991 ?"),
  person("petr_p", "Пётр Андреевич Парамонов", "ок. 1930 · предположительно", "с. Узлив · по семейной схеме", 1290, 50, "Прадед"),
  person("anna_k", "Анна Ивановна Парамонова (Кочергина)", "1925 · дата спорная", "с. Красное Знамя · по семейной схеме", 1540, 50, "Прабабушка", "08.05.1995 ?"),
];

export const SEED_EDGES: Edge[] = [
  parentEdge("alexander", "vova"),
  parentEdge("natalya", "vova"),
  parentEdge("natalya", "sofia"),
  parentEdge("sergey", "sofia"),
  parentEdge("anatoly", "alexander"),
  parentEdge("alexandra", "alexander"),
  parentEdge("vladimir_t", "natalya"),
  parentEdge("valentina", "natalya"),
  parentEdge("fedot", "anatoly"),
  parentEdge("fekla", "anatoly"),
  parentEdge("andrey_t", "vladimir_t"),
  parentEdge("anna_m", "vladimir_t"),
  parentEdge("petr_p", "valentina"),
  parentEdge("anna_k", "valentina"),
];

export const SEED_CANDIDATES: Candidate[] = [
  candidate("vgd_1", "Сивченков · прадед 1913 г. р.", "Ищу прадеда 1913 г.р. фамилия Сивченков, его братьев, его отца. В сообщении упомянута деревня Горавицы Глинковского района.", "https://forum.vgd.ru/post/473/135798/p5581691.htm", "Сивченков", "Горавицы, Смоленская обл."),
  candidate("vgd_2", "Сивченков · деревня Хоменки", "Меня интересуют МК,РС по деревне Хоменки(может кто то работал) интересует фамилия Сивченков", "https://forum.vgd.ru/post/6582/74823/p3876986.htm", "Сивченков", "Хоменки, Смоленская губ."),
  candidate("vgd_3", "Анисим Васильевич Сивченков", "Сивченков Анисим Васильевич (предположительно деревня Хоменки)", "https://forum.vgd.ru/post/1522/128815/p5222701.htm", "Сивченков", "Хоменки, Смоленская губ."),
  candidate("vgd_4", "Сивченков / Савченков · написание фамилии", "У нас в документах Сивченковы,но папа говорил,что до 1920 писали Савченков", "https://forum.vgd.ru/post/232/104724/p4642425.htm", "Сивченков", "Смоленская обл."),
  candidate("vgd_5", "Трофим Владимирович · три написания", "Сивченков Трофим Владимирович; Сивчаков Трофим Владимирович; Савченков Трофим Владимирович (выбыл в Смоленск)", "https://forum.vgd.ru/post/3299/156452/p4961633.htm", "Сивченков", "Смоленск", "Список раненых, перепечатка"),
  candidate("vgd_6", "Слисков · Псковская губерния", "Искомая фамилия: Слисков. Регион поиска: Псковская губ. Порховский уезд, г.Санкт-Петербург", "https://forum.vgd.ru/post/199/41878/p1204179.htm", "Слизков", "Псковская губ."),
  candidate("vgd_7", "Григорий Григорьевич Слизков", "пом.ком.взвода Слизков Григорий Григорьевич 1909 — список на мемориале г. Кимовска", "https://forum.vgd.ru/post/102/14246/p310742.htm", "Слизков", "Кимовск, Тульская обл.", "Мемориал, перепечатка"),
  candidate("vgd_8", "Павел Фёдоров Тарасов · брак 1884", "запись 10 о браке 17.10.1884 ... Павел Фёдоров Тарасов, 32г ... вдова Устина Петрова Феногенова", "https://forum.vgd.ru/post/5779/127487/p4925167.htm", "Тарасов", "Малевка, Тульская губ.", "Метрическая книга, перепечатка"),
  candidate("vgd_9", "Яков Васильев Медведев", "Яков Васильев Медведев (д. Прилепы Богородицкий уезд - ?)", "https://forum.vgd.ru/post/2702/102969/p3112505.htm", "Медведев", "Прилепы, Тульская губ."),
  candidate("vgd_10", "Лыков и Кочергин · с. Столбище", "Фамилии крестьян из Дела о выкупе земельных наделов села Столбища Дмитровского уезда; в списке Лыков и Кочергин.", "https://forum.vgd.ru/post/5706/74761/p4009100.htm", "Кочергин", "Столбище, Орловская губ.", "Архивный указатель"),
  candidate("vgd_11", "Параскева Василиева Кочергина", "Дмитровского уезда селения Столбище государственная крестьянка Параскева Василиева дочь Кочергина", "https://forum.vgd.ru/post/2172/47932/p4145505.htm", "Кочергин", "Столбище, Орловская губ.", "Метрическая книга, перепечатка"),
  candidate("vgd_12", "Фёдор Тихонович Кочергин · 1798", "Кочергин Фёдор Тихонович, 1798 г.р., причислен в 1858 году из дмитровских мещан Орловской губернии.", "https://forum.vgd.ru/post/4743/118058/p4810139.htm", "Кочергин", "Дмитровск, Орловская губ."),
  candidate("vgd_13", "Иван Тихонович Парамонов · 1898", "ПАРАМОНОВ Иван Тихонович, 1898 г. р., уроженец и житель с. М. Боброве Дмитровского р-на Орловской обл.", "https://forum.vgd.ru/50/8557/50.htm", "Парамонов", "Орловская обл."),
  candidate("vgd_14", "Товарково · ландратская перепись 1710", "Ландратская перепись 1710 села Спаское (Товарково) – РГАДА, Ф. 350, о. 1, д. 32", "https://forum.vgd.ru/post/5779/127512/p5193650.htm", "Тарасов", "Товарково, Тульская губ.", "Архивный указатель"),
  candidate("vgd_15", "Товарково · ревизская сказка 1720", "РС1 (1720) села Спаское (Товарково) - РГАДА, Ф. 350, о. 2, д. 399", "https://forum.vgd.ru/post/5779/127512/p5196888.htm", "Медведев", "Товарково, Тульская губ.", "Архивный указатель"),
];

export function createSeedState(): GenealogyState {
  return {
    schemaVersion: VERSION,
    people: SEED_PEOPLE.map((person) => ({ ...person })),
    edges: SEED_EDGES.map((edge) => ({ ...edge })),
    groups: [],
    candidates: SEED_CANDIDATES.map((item) => ({ ...item })),
    arms: [],
    settings: { tree_title: "Дерево семьи Сивченковых" },
    photos: {},
  };
}

export const SEARCH_SOURCES = [
  { id: "vgd", label: "Форум ВГД", kind: "auto" as const, group: "Форумы", description: "Крупнейший русскоязычный генеалогический форум", url: (q: string) => `https://forum.vgd.ru/search/?q=${encodeURIComponent(q)}` },
  { id: "svrt", label: "Форум СВРТ", kind: "external" as const, group: "Форумы", description: "Родословные исследования и региональные разделы", url: (q: string) => `https://forum.svrt.ru/index.php?app=core&module=search&do=search&andor_type=and&search_content=both&search_term=${encodeURIComponent(q)}` },
  { id: "memorial", label: "ОБД Мемориал", kind: "external" as const, group: "ВОВ", description: "Погибшие, пропавшие, пленные и захоронения", url: (q: string) => `https://obd-memorial.ru/html/search.htm?type=1&firstName=&lastName=${encodeURIComponent(q)}` },
  { id: "pamyat", label: "Память народа", kind: "external" as const, group: "ВОВ", description: "Боевой путь, награды, потери и документы", url: (q: string) => `https://pamyat-naroda.ru/heroes/?last_name=${encodeURIComponent(q)}` },
  { id: "podvig", label: "Подвиг народа", kind: "external" as const, group: "ВОВ", description: "Наградные листы и приказы", url: (q: string) => `https://podvignaroda.ru/?#tab=navPerson_search` },
  { id: "neb", label: "НЭБ", kind: "external" as const, group: "Архивы", description: "Адрес-календари, памятные книжки и редкие издания", url: (q: string) => `https://rusneb.ru/search/?q=${encodeURIComponent(q)}` },
];
