interface SearchablePlace {
  name: string;
  address: string;
  code: string;
}

export function normalizeMapSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi")
    .trim();
}

export function matchesMapSearch(
  place: SearchablePlace,
  query: string,
): boolean {
  const terms = normalizeMapSearch(query).split(/\s+/).filter(Boolean);
  const text = normalizeMapSearch(
    `${place.name} ${place.address} ${place.code}`,
  );
  return terms.every((term) => text.includes(term));
}
