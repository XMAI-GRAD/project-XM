/** Lowercase, without diacritics (đ counts as d) and with single spaces, for matching. */
export const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** The items whose name contains the query, ignoring case and diacritics. */
export const search = <T extends { name: string }>(
  items: T[],
  query: string,
) => {
  const q = fold(query);
  return q ? items.filter((i) => fold(i.name).includes(q)) : [];
};
