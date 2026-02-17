const EVENT_CATEGORY_LABELS: Record<string, string> = {
  exhibition: "Выставка",
  concert: "Концерт",
  performance: "Спектакль",
};

type ImagePaths = {
  theatreShowSrc?: string;
  smallEventSrc?: string;
};

type IncomingEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  dateType?: "single" | "duration";
  address?: string;
  timeMode?: "none" | "start" | "range";
  startTime?: string | null;
  endTime?: string | null;
  category?: string;
  categoryLabel?: string;
  tagLabel?: string;
  imageUrl?: string | null;
  description?: string;
  url?: string;
};

type NormalizedEvent = {
  id: string;
  title: string;
  tag: string;
  image: string;
  description: string;
  location: string;
  time: string;
  startDate: Date;
  endDate: Date;
  dateRangeLabel: string;
  url: string;
};

const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const maybeSeconds =
      (value as { seconds?: number; _seconds?: number }).seconds ??
      (value as { seconds?: number; _seconds?: number })._seconds;
    if (typeof maybeSeconds === "number") {
      return new Date(maybeSeconds * 1000);
    }
    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
  }
  return null;
};

const resetToUtcMidnight = (date: Date) => {
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const formatRangeLabel = (start: Date, end: Date): string => {
  const format = (date: Date, withYear = false) =>
    date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      ...(withYear ? { year: "numeric" } : {}),
    });

  if (start.getTime() === end.getTime()) {
    return format(start, true);
  }
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${format(start, !sameYear)} – ${format(end, true)}`;
};

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

const formatTimeLabel = (incoming: IncomingEvent): string => {
  const mode =
    incoming?.timeMode === "start" || incoming?.timeMode === "range"
      ? incoming.timeMode
      : "none";
  const start = ensureString(incoming?.startTime, "");
  const end = ensureString(incoming?.endTime, "");

  if (mode === "start" && start) {
    return `Начало в ${start}`;
  }
  if (mode === "range" && start && end) {
    return `${start} – ${end}`;
  }
  return "Время уточняется";
};

const createEventNormalizer =
  (imagePaths: ImagePaths) =>
  (incoming: IncomingEvent): NormalizedEvent | null => {
    const startRaw = toDate(incoming?.startDate);
    if (!startRaw) {
      return null;
    }
    const startDate = resetToUtcMidnight(new Date(startRaw));
    const endRaw = toDate(incoming?.endDate) ?? startDate;
    const endDate = resetToUtcMidnight(new Date(endRaw));

    const tagLabel = ensureString(
      incoming?.tagLabel,
      EVENT_CATEGORY_LABELS[incoming?.category as keyof typeof EVENT_CATEGORY_LABELS] ||
        incoming?.categoryLabel ||
        "Событие",
    );

    const description = ensureString(incoming?.description, "Описание появится позже.");

    const fallbackImage = ensureString(
      incoming?.imageUrl,
      imagePaths.theatreShowSrc || imagePaths.smallEventSrc || "",
    );

    const id = ensureString(incoming?.id, crypto.randomUUID?.() ?? `${Date.now()}`);

    return {
      id,
      title: ensureString(incoming?.title, "Событие"),
      tag: tagLabel,
      image: fallbackImage,
      description,
      location: ensureString(incoming?.address, "Место уточняется"),
      time: formatTimeLabel(incoming),
      startDate,
      endDate,
      dateRangeLabel: formatRangeLabel(startDate, endDate),
      url: ensureString(incoming?.url, `/events/${id}`),
    };
  };

const isDateWithinRange = (date: Date, event: NormalizedEvent) => {
  if (!date) {
    return false;
  }
  const time = date.getTime();
  return time >= event.startDate.getTime() && time <= event.endDate.getTime();
};

const isBoundaryDate = (date: Date, event: NormalizedEvent) => {
  const time = date.getTime();
  return time === event.startDate.getTime() || time === event.endDate.getTime();
};

const isOngoingDate = (date: Date, event: NormalizedEvent) => {
  const time = date.getTime();
  return time > event.startDate.getTime() && time < event.endDate.getTime();
};

export default (initialState: { imagePaths?: ImagePaths; events?: IncomingEvent[] } = {}) => ({
  // Raw bootstrap data
  imagePaths: initialState.imagePaths ?? {},
  rawEvents: Array.isArray(initialState.events) ? initialState.events : [],

  // State
  selectedDate: null as Date | null,
  year: 0,
  month: 0,
  monthName: "",
  daysInMonth: 0,
  firstDayOfMonth: 0,

  events: [] as NormalizedEvent[],
  filteredEvents: [] as NormalizedEvent[],
  smallEvents: [] as NormalizedEvent[],
  filters: ["все"],
  activeFilter: "все",

  init() {
    const normalizeEvent = createEventNormalizer(this.imagePaths);
    this.events = this.rawEvents
      .map(normalizeEvent)
      .filter((event): event is NormalizedEvent => Boolean(event))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const today = resetToUtcMidnight(new Date());
    const ongoingToday = this.events.some((event) => isDateWithinRange(today, event));
    const nearestUpcoming = this.events.find(
      (event) =>
        event.startDate.getTime() >= today.getTime() ||
        event.endDate.getTime() >= today.getTime(),
    );

    if (ongoingToday || !nearestUpcoming) {
      this.selectedDate = today;
    } else {
      this.selectedDate = resetToUtcMidnight(new Date(nearestUpcoming.startDate));
    }

    this.year = this.selectedDate.getUTCFullYear();
    this.month = this.selectedDate.getUTCMonth();

    const uniqueFilters = Array.from(new Set(this.events.map((event) => event.tag)));
    this.filters = ["все", ...uniqueFilters];

    this.updateCalendarDisplay();
    this.updateFilteredEvents();
  },

  updateCalendarDisplay() {
    const firstDay = new Date(Date.UTC(this.year, this.month, 1));
    this.monthName = firstDay.toLocaleDateString("ru-RU", {
      month: "long",
      timeZone: "UTC",
    });
    this.daysInMonth = new Date(Date.UTC(this.year, this.month + 1, 0)).getUTCDate();
    this.firstDayOfMonth = (firstDay.getUTCDay() + 6) % 7;
  },

  updateFilteredEvents() {
    if (!this.selectedDate) {
      this.filteredEvents = [];
      this.smallEvents = [];
      return;
    }

    const eventsForDate = this.events.filter((event) =>
      isDateWithinRange(this.selectedDate as Date, event),
    );

    const filtered =
      this.activeFilter === "все"
        ? eventsForDate
        : eventsForDate.filter((event) => event.tag === this.activeFilter);

    this.filteredEvents = filtered.filter((event) =>
      isBoundaryDate(this.selectedDate as Date, event),
    );
    this.smallEvents = filtered
      .filter((event) => isOngoingDate(this.selectedDate as Date, event))
      .slice(0, 4);
  },

  changeMonth(direction: number) {
    this.month += direction;
    if (this.month < 0) {
      this.month = 11;
      this.year -= 1;
    } else if (this.month > 11) {
      this.month = 0;
      this.year += 1;
    }
    this.updateCalendarDisplay();
  },

  selectDate(day: number) {
    this.selectedDate = new Date(Date.UTC(this.year, this.month, day));
    this.updateFilteredEvents();
  },

  hasEvent(day: number) {
    const date = new Date(Date.UTC(this.year, this.month, day));
    return this.events.some((event) => isBoundaryDate(date, event));
  },

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.updateFilteredEvents();
  },

  isSameDay(date1?: Date | null, date2?: Date | null) {
    if (!date1 || !date2) {
      return false;
    }
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  },
});
