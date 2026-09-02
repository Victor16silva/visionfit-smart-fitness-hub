export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export type WeekStripDay = {
  date: Date;
  day: string;
  dateNum: number;
  isToday: boolean;
  key: string;
};

/** Segunda a sexta da semana atual, com o dia de hoje marcado. */
export function getWeekdayStrip(reference = new Date()): WeekStripDay[] {
  const today = startOfLocalDay(reference);
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysFromMonday);

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    return {
      date,
      day: WEEKDAY_LABELS[date.getDay()],
      dateNum: date.getDate(),
      isToday: date.getTime() === today.getTime(),
      key: toLocalDateKey(date),
    };
  });
}
