/** One end of an event's date range: machine-readable `iso` and padded `label`. */
export interface DateEnd {
  iso: string;
  label: string;
}

// Dates are calendar days (YYYY-MM-DD), so read the parts: no time zone to shift them.
// vi and en both write day/month, so one format serves both languages.
const label = (iso: string, withYear: boolean) => {
  const [y, m, d] = iso.split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
};

/** Start and optional end, each formatted on its own; the start drops a year the end repeats. */
export function eventDates(date: string, endDate?: string): DateEnd[] {
  if (!endDate || endDate === date)
    return [{ iso: date, label: label(date, true) }];
  return [
    { iso: date, label: label(date, date.slice(0, 4) !== endDate.slice(0, 4)) },
    { iso: endDate, label: label(endDate, true) },
  ];
}
