export const ALLOWED_GENRES = [
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Biography",
  "Other",
] as const;

export type GenreType = (typeof ALLOWED_GENRES)[number];

export const GENRE_TIE_BREAK: Record<string, number> = {
  Fiction: 1,
  "Non-Fiction": 2,
  "Sci-Fi": 3,
  Biography: 4,
  Other: 5,
};
