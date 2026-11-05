export const ALLOWED_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Other",
] as const;

export type ExpenseCategory = (typeof ALLOWED_CATEGORIES)[number];

