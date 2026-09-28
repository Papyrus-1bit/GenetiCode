export interface HeraldryAsset {
  id: string;
  name: string;
  category: string;
  path: string;
  viewBox?: string;
}

export const ASSET_CATEGORIES = [
  "Животные",
  "Птицы",
  "Растения",
  "Короны",
  "Кресты",
  "Звёзды",
  "Солнце/луна",
  "Геометрия",
  "Оружие",
  "Инструменты",
  "Предметы",
  "Орнаменты",
  "Символы",
  "Пользовательские",
] as const;

export const HERALDRY_ASSETS: HeraldryAsset[] = [
  { id: "lion", name: "Лев", category: "Животные", path: "M20 70 Q40 20 70 38 Q90 18 110 42 L150 48 Q130 70 118 66 L170 90 L130 86 Q140 120 90 112 Q70 150 48 120 Q18 128 28 96 Q8 90 20 70Z" },
  { id: "stag", name: "Олень", category: "Животные", path: "M40 120 L52 70 L40 48 L58 58 L70 28 L78 58 L96 40 L86 70 L150 90 L130 150 H70Z" },
  { id: "wolf", name: "Волк", category: "Животные", path: "M30 80 L70 40 L110 70 L160 90 L140 140 H60 L30 110Z" },
  { id: "eagle", name: "Орёл", category: "Птицы", path: "M100 20 L120 70 L180 50 L140 90 L170 150 L100 120 L30 150 L60 90 L20 50 L80 70Z" },
  { id: "bird", name: "Птица", category: "Птицы", path: "M20 110 Q60 20 150 50 Q120 80 90 80 L160 130 Q80 110 40 140 Q50 110 20 110Z" },
  { id: "oak", name: "Дуб", category: "Растения", path: "M100 20 Q150 40 140 80 Q180 90 150 120 Q160 160 110 150 L110 190 H90 L90 150 Q40 160 50 120 Q20 90 60 80 Q50 40 100 20Z" },
  { id: "wheat", name: "Колос", category: "Растения", path: "M100 20 L120 50 L100 80 L120 110 L100 140 L110 190 H90 L100 140 L80 110 L100 80 L80 50Z" },
  { id: "branch", name: "Ветвь", category: "Растения", path: "M30 160 Q80 80 170 40 M70 120 L90 90 M110 90 L130 60" },
  { id: "crown", name: "Корона", category: "Короны", path: "M20 80 L50 40 L100 70 L150 40 L180 80 L170 140 H30Z" },
  { id: "cross", name: "Крест", category: "Кресты", path: "M80 20 H120 V80 H180 V120 H120 V180 H80 V120 H20 V80 H80Z" },
  { id: "star", name: "Звезда", category: "Звёзды", path: "M100 15 L118 75 H180 L130 110 L148 175 L100 140 L52 175 L70 110 L20 75 H82Z" },
  { id: "sun", name: "Солнце", category: "Солнце/луна", path: "M100 40 A60 60 0 1 1 99.9 40 M100 10 V0 M150 25 L160 15 M175 70 H190 M150 130 L160 145 M100 155 V170 M50 130 L40 145 M25 70 H10 M50 25 L40 15" },
  { id: "moon", name: "Луна", category: "Солнце/луна", path: "M120 30 A70 70 0 1 0 120 170 A50 50 0 1 1 120 30Z" },
  { id: "tower", name: "Башня", category: "Геометрия", path: "M40 180 V80 H30 V60 H50 V70 H70 V60 H90 V70 H110 V60 H130 V70 H150 V60 H170 V80 H160 V180Z" },
  { id: "diamond", name: "Ромб", category: "Геометрия", path: "M100 20 L180 100 L100 180 L20 100Z" },
  { id: "sword", name: "Меч", category: "Оружие", path: "M95 20 H105 L108 130 H130 V145 H70 V130 H92Z" },
  { id: "key", name: "Ключ", category: "Инструменты", path: "M60 50 A30 30 0 1 1 60 51 M90 50 H170 V70 H150 V90 H130 V70 H110Z" },
  { id: "book", name: "Книга", category: "Предметы", path: "M30 40 H100 V160 H30 Q50 140 30 40Z M170 40 H100 V160 H170 Q150 140 170 40Z" },
  { id: "ornament", name: "Орнамент", category: "Орнаменты", path: "M20 100 Q60 20 100 100 Q140 180 180 100" },
  { id: "symbol", name: "Монограмма", category: "Символы", path: "M40 160 L40 40 L100 120 L160 40 V160" },
];

export function assetById(id: string | undefined): HeraldryAsset | undefined {
  return HERALDRY_ASSETS.find((asset) => asset.id === id);
}
