export const sanitizeText = (value: string, maxLength = 160) => {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

export const sanitizeEmail = (value: string) => sanitizeText(value, 120).toLowerCase();

export const sanitizeSearchFilters = (value: string[]) => value.map((item) => sanitizeText(item, 40));
