/** Format a nearby point link label with a one-decimal localized distance. */
export function nearbyLabel(
  name: string,
  km: number,
  lang: "vi" | "en",
): string {
  const distance = km.toLocaleString(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${name} (${distance} km)`;
}
