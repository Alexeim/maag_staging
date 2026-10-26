// French badge/tag labels, keyed by the lowercased Russian label (stored tag
// values are Russian strings, and English alias keys resolve to a Russian
// label first — see contentBadge.ts). The list covers the tag dictionaries
// plus every tag stored on a material on 2026-10-26. A tag missing here keeps
// its Russian label on French pages rather than disappearing.
export const FR_TAG_LABELS: Record<string, string> = {
  // Culture dictionary
  "театр": "Théâtre",
  "театры": "Théâtres",
  "выставка": "Exposition",
  "выставки": "Expositions",
  "книги": "Livres",
  "арт-рынок": "Marché de l'art",
  "фестиваль": "Festival",
  "фестивали": "Festivals",
  "дети": "Enfants",
  "опера": "Opéra",
  "балет": "Ballet",
  "танец": "Danse",
  "музыка": "Musique",
  "классическая музыка": "Musique classique",
  "концерт": "Concert",
  "некролог": "Nécrologie",
  "назначение": "Nomination",
  "арт": "Art",
  "кино": "Cinéma",
  "кадры": "Carrières",
  "архитектура": "Architecture",
  "аукцион": "Enchères",
  "фотография": "Photographie",
  // Paris dictionary
  "маршрут": "Itinéraire",
  "адрес": "Adresse",
  "записная книжка": "Carnet",
  "место": "Lieu",
  "история": "Histoire",
  "парки": "Parcs",
  "путешествия": "Voyages",
  "отели": "Hôtels",
  "событие": "Événement",
  "рестораны": "Restaurants",
  "еда": "Cuisine",
  "мода": "Mode",
  "путеводитель": "Guide",
  "часы": "Horlogerie",
  // Stored on materials but in neither dictionary, and the alias labels
  "культура": "Culture",
  "париж": "Paris",
  "туризм": "Tourisme",
  "музеи": "Musées",
  "визит": "Visite",
  "забастовка": "Grève",
  "дизайн": "Design",
  "спектакль": "Spectacle",
  "интервью": "Interview",
  "новости": "Actualités",
  "новость": "Actualité",
  "гид": "Guide",
  "листалка": "Diaporama",
  "крупным планом": "Gros plan",
};

// Content-type fallbacks (items without tags) and the fixed badges.
export const FR_CONTENT_TYPE_LABELS: Record<string, string> = {
  article: "Article",
  guide: "Guide",
  flipper: "Diaporama",
  event: "Événement",
  "visual-story": "Gros plan",
  photoOfTheDay: "Photo du jour",
};

export const FR_FIXED_BADGES = {
  news: "Actualités",
  newsItem: "Actualité",
  interview: "Interview",
  material: "Contenu",
};

const DISTRICT_RE = /^district-(\d{1,2})$/;

// "district-1" → "1er arrondissement", "district-7" → "7e arrondissement".
export const frenchDistrictLabel = (key: string): string | null => {
  const match = DISTRICT_RE.exec(key);
  if (!match) return null;
  const n = Number(match[1]);
  return `${n}${n === 1 ? "er" : "e"} arrondissement`;
};
