import type { PostCategory } from "./queries";

const CATEGORY_LABELS = {
  actividad: "Actividad",
  aviso: "Aviso",
  menu: "Menú",
  foto: "Foto",
  espacio: "Espacio",
} satisfies Record<PostCategory, string>;

export const POST_CATEGORY_VALUES: readonly PostCategory[] = Object.freeze([
  "actividad",
  "aviso",
  "menu",
  "foto",
  "espacio",
]);

const POST_DATE_FORMATTER = new Intl.DateTimeFormat("es", {
  dateStyle: "long",
});

const EXCERPT_MAX_LENGTH = 160;

export function getCategoryLabel(category: PostCategory | null): string | null {
  if (category === null) {
    return null;
  }

  return CATEGORY_LABELS[category];
}

export function formatPostDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return POST_DATE_FORMATTER.format(date);
}

export function getPostExcerpt(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();

  if (normalized.length <= EXCERPT_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…`;
}

export function getPostImageAlt(
  altText: string | null,
  title: string,
  index: number,
  total: number,
): string {
  const providedAlt = altText?.trim();

  if (providedAlt) {
    return providedAlt;
  }

  if (total > 1) {
    return `${title} (imagen ${index + 1} de ${total})`;
  }

  return title;
}
