export function startOfUtcDay(input = new Date()) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function parseDateParam(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Date must be YYYY-MM-DD");
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function localDateKey(date = new Date(), timeZone = "America/Los_Angeles") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
