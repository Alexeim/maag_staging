export interface CalendarPageAutoEventCandidate {
  id: string;
  startDate: string | Date;
  endDate?: string | Date | null;
}

const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object") {
    const seconds =
      (value as { seconds?: number }).seconds ??
      (value as { _seconds?: number })._seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }

    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      const parsed = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
};

const resetToUtcMidnight = (date: Date) => {
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getWeekBounds = (date: Date) => {
  const weekStart = resetToUtcMidnight(new Date(date));
  const dayOfWeek = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);

  const weekEnd = resetToUtcMidnight(new Date(weekStart));
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  return {
    weekStart,
    weekEnd,
  };
};

const getComparableRange = (event: CalendarPageAutoEventCandidate) => {
  const start = toDate(event.startDate);
  if (!start) {
    return null;
  }

  const normalizedStart = resetToUtcMidnight(new Date(start));
  const end = toDate(event.endDate) ?? normalizedStart;
  const normalizedEnd = resetToUtcMidnight(new Date(end));

  return {
    start: normalizedStart,
    end: normalizedEnd,
  };
};

const isSingleDayRange = (start: Date, end: Date) => start.getTime() === end.getTime();

const sortByStartDateAsc = (left: CalendarPageAutoEventCandidate, right: CalendarPageAutoEventCandidate) => {
  const leftStart = getComparableRange(left)?.start.getTime() ?? Number.POSITIVE_INFINITY;
  const rightStart = getComparableRange(right)?.start.getTime() ?? Number.POSITIVE_INFINITY;
  return leftStart - rightStart;
};

export const resolveAutoSecondaryEventIds = (
  events: CalendarPageAutoEventCandidate[],
  limit = 4,
  today = resetToUtcMidnight(new Date()),
) => {
  const { weekStart, weekEnd } = getWeekBounds(today);
  const currentWeekSingleDay: CalendarPageAutoEventCandidate[] = [];
  const currentWeekDuration: CalendarPageAutoEventCandidate[] = [];
  const upcomingSingleDay: CalendarPageAutoEventCandidate[] = [];
  const upcomingDuration: CalendarPageAutoEventCandidate[] = [];

  events.forEach((event) => {
    const range = getComparableRange(event);
    if (!range) {
      return;
    }

    const { start, end } = range;

    if (start.getTime() <= weekEnd.getTime() && end.getTime() >= weekStart.getTime()) {
      if (isSingleDayRange(start, end)) {
        currentWeekSingleDay.push(event);
      } else {
        currentWeekDuration.push(event);
      }
      return;
    }

    if (start.getTime() > weekEnd.getTime()) {
      if (isSingleDayRange(start, end)) {
        upcomingSingleDay.push(event);
      } else {
        upcomingDuration.push(event);
      }
    }
  });

  return [
    ...currentWeekSingleDay.sort(sortByStartDateAsc),
    ...currentWeekDuration.sort(sortByStartDateAsc),
    ...upcomingSingleDay.sort(sortByStartDateAsc),
    ...upcomingDuration.sort(sortByStartDateAsc),
  ]
    .slice(0, limit)
    .map((event) => event.id);
};
