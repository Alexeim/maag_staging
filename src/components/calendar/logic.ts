import { getCalendarToday } from "@/lib/utils/calendarDate";

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

type FeaturedEvent = {
  id: string;
  title: string;
  imageUrl: string;
  address: string;
  categoryLabel: string;
  dateLabel: string;
  url: string;
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

type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

// Generic index-based fade carousel: powers "Главные события" on all
// breakpoints, and the mobile-only single-card view for other event
// sections. One state object per carousel name, keyed in `this.carousels`.
type CarouselState = {
  items: unknown[];
  activeIndex: number;
  isVisible: boolean;
  transitionTimer: ReturnType<typeof setTimeout> | null;
  autoplayIntervalMs: number;
  autoplayResumeDelayMs: number;
  autoplayTimer: ReturnType<typeof setInterval> | null;
  autoplayResumeTimer: ReturnType<typeof setTimeout> | null;
  isHovered: boolean;
  isFocused: boolean;
  isAutoplayPausedByUser: boolean;
};

const createCarouselState = (
  items: unknown[],
  autoplayIntervalMs = 4500,
  autoplayResumeDelayMs = 8000,
): CarouselState => ({
  items,
  activeIndex: 0,
  isVisible: true,
  transitionTimer: null,
  autoplayIntervalMs,
  autoplayResumeDelayMs,
  autoplayTimer: null,
  autoplayResumeTimer: null,
  isHovered: false,
  isFocused: false,
  isAutoplayPausedByUser: false,
});

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

const formatSelectedRangeHeading = (start: Date, end?: Date | null): string => {
  const formatMonthWithDay = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });

  const sameDay =
    !end ||
    (start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCDate() === end.getUTCDate());

  if (sameDay) {
    return formatMonthWithDay(start);
  }

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const month = formatMonthWithDay(end).replace(/^\d+\s+/, "");
    return `${start.getUTCDate()}–${end.getUTCDate()} ${month}`;
  }

  return `${formatMonthWithDay(start)} – ${formatMonthWithDay(end)}`;
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
      ensureString(incoming?.categoryLabel, "Событие"),
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

const isSingleDayEvent = (event: NormalizedEvent) =>
  event.startDate.getTime() === event.endDate.getTime();

const getUniqueFilters = (events: NormalizedEvent[]) =>
  Array.from(new Set(events.map((event) => event.tag)));

const getMonthBoundaryDates = (events: NormalizedEvent[], year: number, month: number) => {
  return events
    .flatMap((event) => [event.startDate, event.endDate])
    .filter(
      (date) => date.getUTCFullYear() === year && date.getUTCMonth() === month,
    )
    .sort((a, b) => a.getTime() - b.getTime());
};

export default (
  initialState: {
    imagePaths?: ImagePaths;
    events?: IncomingEvent[];
    featuredEvents?: FeaturedEvent[];
    topCards?: FeaturedEvent[];
    lastChanceCards?: FeaturedEvent[];
  } = {},
) => ({
  // Raw bootstrap data
  imagePaths: initialState.imagePaths ?? {},
  rawEvents: Array.isArray(initialState.events) ? initialState.events : [],
  featuredEvents: Array.isArray(initialState.featuredEvents)
    ? initialState.featuredEvents
    : [],
  topCards: Array.isArray(initialState.topCards) ? initialState.topCards : [],
  lastChanceCards: Array.isArray(initialState.lastChanceCards)
    ? initialState.lastChanceCards
    : [],

  // State
  selectedDate: null as Date | null,
  rangeStartDate: null as Date | null,
  rangeEndDate: null as Date | null,
  hoverDate: null as Date | null,
  isRangeSelecting: false,
  year: 0,
  month: 0,
  monthName: "",
  daysInMonth: 0,
  firstDayOfMonth: 0,
  calendarDays: [] as CalendarDay[],

  events: [] as NormalizedEvent[],
  filteredEvents: [] as NormalizedEvent[],
  smallEvents: [] as NormalizedEvent[],
  rangeSpecificEvents: [] as NormalizedEvent[],
  rangeFlexibleEvents: [] as NormalizedEvent[],
  filters: [] as string[],
  availableEventsCount: 0,
  filteredEventsCount: 0,
  activeFilters: [] as string[],
  carousels: {} as Record<string, CarouselState>,
  prefersReducedMotion: false,
  carouselVisibilityHandler: null as (() => void) | null,

  init() {
    const normalizeEvent = createEventNormalizer(this.imagePaths);
    this.events = this.rawEvents
      .map(normalizeEvent)
      .filter((event): event is NormalizedEvent => Boolean(event))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const today = getCalendarToday();
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
    this.rangeStartDate = this.selectedDate ? new Date(this.selectedDate) : null;
    this.rangeEndDate = null;

    this.year = this.selectedDate.getUTCFullYear();
    this.month = this.selectedDate.getUTCMonth();

    // Restore saved selection (persists across Astro view transitions)
    this.restoreSelectionFromStorage();

    this.updateCalendarDisplay();
    this.updateFilteredEvents();

    this.carousels = {
      featured: createCarouselState(this.featuredEvents),
      topCards: createCarouselState(this.topCards),
      lastChance: createCarouselState(this.lastChanceCards),
    };

    if (typeof globalThis.matchMedia === "function") {
      this.prefersReducedMotion = globalThis
        .matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
    }

    if (typeof document !== "undefined") {
      this.carouselVisibilityHandler = () => {
        Object.keys(this.carousels).forEach((name) =>
          this.updateCarouselAutoplayState(name),
        );
      };
      document.addEventListener(
        "visibilitychange",
        this.carouselVisibilityHandler,
      );
    }

    Object.keys(this.carousels).forEach((name) =>
      this.updateCarouselAutoplayState(name),
    );
  },

  destroy() {
    Object.keys(this.carousels).forEach((name) => {
      this.stopCarouselAutoplay(name);
      const carousel = this.carousels[name];

      if (carousel.transitionTimer) {
        clearTimeout(carousel.transitionTimer);
        carousel.transitionTimer = null;
      }

      if (carousel.autoplayResumeTimer) {
        clearTimeout(carousel.autoplayResumeTimer);
        carousel.autoplayResumeTimer = null;
      }
    });

    if (
      typeof document !== "undefined" &&
      this.carouselVisibilityHandler
    ) {
      document.removeEventListener(
        "visibilitychange",
        this.carouselVisibilityHandler,
      );
      this.carouselVisibilityHandler = null;
    }
  },

  getCarouselItem(name: string) {
    const carousel = this.carousels[name];
    return carousel?.items[carousel.activeIndex] ?? null;
  },

  isCarouselItemVisible(name: string) {
    return this.carousels[name]?.isVisible ?? false;
  },

  hasMultipleCarouselItems(name: string) {
    return (this.carousels[name]?.items.length ?? 0) > 1;
  },

  canAutoplayCarousel(name: string) {
    const carousel = this.carousels[name];
    return Boolean(
      carousel &&
        this.hasMultipleCarouselItems(name) &&
        !this.prefersReducedMotion &&
        !carousel.isHovered &&
        !carousel.isFocused &&
        !carousel.isAutoplayPausedByUser &&
        (typeof document === "undefined" || document.visibilityState === "visible"),
    );
  },

  startCarouselAutoplay(name: string) {
    const carousel = this.carousels[name];
    if (!carousel || carousel.autoplayTimer || !this.canAutoplayCarousel(name)) {
      return;
    }

    carousel.autoplayTimer = setInterval(() => {
      this.nextCarouselItem(name, false);
    }, carousel.autoplayIntervalMs);
  },

  stopCarouselAutoplay(name: string) {
    const carousel = this.carousels[name];
    if (!carousel?.autoplayTimer) {
      return;
    }

    clearInterval(carousel.autoplayTimer);
    carousel.autoplayTimer = null;
  },

  updateCarouselAutoplayState(name: string) {
    if (this.canAutoplayCarousel(name)) {
      this.startCarouselAutoplay(name);
      return;
    }

    this.stopCarouselAutoplay(name);
  },

  pauseCarouselAutoplayTemporarily(name: string) {
    const carousel = this.carousels[name];
    if (!carousel) {
      return;
    }

    carousel.isAutoplayPausedByUser = true;
    this.stopCarouselAutoplay(name);

    if (carousel.autoplayResumeTimer) {
      clearTimeout(carousel.autoplayResumeTimer);
    }

    carousel.autoplayResumeTimer = setTimeout(() => {
      carousel.isAutoplayPausedByUser = false;
      carousel.autoplayResumeTimer = null;
      this.updateCarouselAutoplayState(name);
    }, carousel.autoplayResumeDelayMs);
  },

  setCarouselHover(name: string, isHovered: boolean) {
    const carousel = this.carousels[name];
    if (!carousel) {
      return;
    }
    carousel.isHovered = isHovered;
    this.updateCarouselAutoplayState(name);
  },

  setCarouselFocus(name: string, isFocused: boolean) {
    const carousel = this.carousels[name];
    if (!carousel) {
      return;
    }
    carousel.isFocused = isFocused;
    this.updateCarouselAutoplayState(name);
  },

  switchCarouselItem(name: string, direction: 1 | -1) {
    const carousel = this.carousels[name];
    if (!carousel || carousel.items.length < 2) {
      return;
    }

    if (carousel.transitionTimer) {
      clearTimeout(carousel.transitionTimer);
      carousel.transitionTimer = null;
    }

    const nextIndex =
      (carousel.activeIndex + direction + carousel.items.length) %
      carousel.items.length;

    carousel.isVisible = false;
    carousel.transitionTimer = setTimeout(() => {
      carousel.activeIndex = nextIndex;
      carousel.isVisible = true;
      carousel.transitionTimer = null;
    }, 160);
  },

  prevCarouselItem(name: string, userInitiated = true) {
    if (userInitiated) {
      this.pauseCarouselAutoplayTemporarily(name);
    }
    this.switchCarouselItem(name, -1);
  },

  nextCarouselItem(name: string, userInitiated = true) {
    if (userInitiated) {
      this.pauseCarouselAutoplayTemporarily(name);
    }
    this.switchCarouselItem(name, 1);
  },

  updateCalendarDisplay() {
    const firstDay = new Date(Date.UTC(this.year, this.month, 1));
    this.monthName = firstDay.toLocaleDateString("ru-RU", {
      month: "long",
      timeZone: "UTC",
    });
    this.daysInMonth = new Date(Date.UTC(this.year, this.month + 1, 0)).getUTCDate();
    this.firstDayOfMonth = (firstDay.getUTCDay() + 6) % 7;
    this.calendarDays = this.buildCalendarDays();
  },

  buildCalendarDays() {
    const days: CalendarDay[] = [];
    const previousMonthDate = new Date(Date.UTC(this.year, this.month, 0));
    const previousMonthDays = previousMonthDate.getUTCDate();

    for (let offset = this.firstDayOfMonth - 1; offset >= 0; offset -= 1) {
      const day = previousMonthDays - offset;
      days.push({
        date: new Date(Date.UTC(this.year, this.month - 1, day)),
        day,
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= this.daysInMonth; day += 1) {
      days.push({
        date: new Date(Date.UTC(this.year, this.month, day)),
        day,
        isCurrentMonth: true,
      });
    }

    const trailingDays = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= trailingDays; day += 1) {
      days.push({
        date: new Date(Date.UTC(this.year, this.month + 1, day)),
        day,
        isCurrentMonth: false,
      });
    }

    return days;
  },

  resolveCalendarDate(value: number | Date | CalendarDay) {
    if (typeof value === "number") {
      return new Date(Date.UTC(this.year, this.month, value));
    }
    if (value instanceof Date) {
      return resetToUtcMidnight(new Date(value));
    }
    return resetToUtcMidnight(new Date(value.date));
  },

  getDefaultDateForMonth(year: number, month: number) {
    const today = getCalendarToday();
    if (
      today.getUTCFullYear() === year &&
      today.getUTCMonth() === month
    ) {
      return today;
    }

    const monthBoundaryDates = getMonthBoundaryDates(this.events, year, month);
    if (monthBoundaryDates.length > 0) {
      return resetToUtcMidnight(new Date(monthBoundaryDates[0]));
    }
    return new Date(Date.UTC(year, month, 1));
  },

  updateFilteredEvents() {
    if (!this.selectedDate) {
      this.filteredEvents = [];
      this.smallEvents = [];
      this.rangeSpecificEvents = [];
      this.rangeFlexibleEvents = [];
      this.filters = [];
      this.availableEventsCount = 0;
      this.filteredEventsCount = 0;
      return;
    }

    const isRange = this.hasCompletedRange() && this.rangeStartDate && this.rangeEndDate;

    let eventsForDate: NormalizedEvent[];

    if (isRange) {
      const rangeStart = this.rangeStartDate!.getTime();
      const rangeEnd = this.rangeEndDate!.getTime();
      eventsForDate = this.events.filter(
        (event) =>
          event.startDate.getTime() <= rangeEnd &&
          event.endDate.getTime() >= rangeStart,
      );
    } else {
      eventsForDate = this.events.filter((event) =>
        isDateWithinRange(this.selectedDate as Date, event),
      );
    }

    this.availableEventsCount = eventsForDate.length;
    this.filters = getUniqueFilters(eventsForDate);

    this.activeFilters = this.activeFilters.filter((f) => this.filters.includes(f));

    const filtered =
      this.activeFilters.length === 0
        ? eventsForDate
        : eventsForDate.filter((event) => this.activeFilters.includes(event.tag));

    this.filteredEventsCount = filtered.length;

    if (isRange) {
      this.filteredEvents = filtered;
      this.smallEvents = [];
      this.rangeSpecificEvents = filtered.filter((event) => isSingleDayEvent(event));
      this.rangeFlexibleEvents = filtered.filter((event) => !isSingleDayEvent(event));
    } else {
      this.rangeSpecificEvents = [];
      this.rangeFlexibleEvents = [];
      this.filteredEvents = filtered.filter((event) =>
        isBoundaryDate(this.selectedDate as Date, event),
      );
      this.smallEvents = filtered
        .filter((event) => isOngoingDate(this.selectedDate as Date, event));
    }
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
    this.isRangeSelecting = false;
    this.hoverDate = null;
    this.updateFilteredEvents();
    this.saveSelectionToStorage();
  },

  selectDate(value: number | CalendarDay) {
    const nextSelectedDate = this.resolveCalendarDate(value);

    if (this.isRangeSelecting) {
      if (this.isSameDay(this.rangeStartDate, nextSelectedDate)) {
        // Second tap on the same date — confirm as a single day
        this.isRangeSelecting = false;
        this.rangeEndDate = null;
      } else {
        // Second tap on a different date — complete the range
        if (nextSelectedDate.getTime() < (this.rangeStartDate?.getTime() ?? 0)) {
          this.rangeEndDate = new Date(this.rangeStartDate!);
          this.rangeStartDate = new Date(nextSelectedDate);
        } else {
          this.rangeEndDate = new Date(nextSelectedDate);
        }
        this.isRangeSelecting = false;
      }
    } else {
      // First tap on a fresh date — always start a new pending range from here,
      // discarding whatever was selected before. Resolved on the next tap.
      this.rangeStartDate = new Date(nextSelectedDate);
      this.rangeEndDate = null;
      this.isRangeSelecting = true;
    }

    this.hoverDate = null;
    this.selectedDate = nextSelectedDate;

    if (typeof value !== "number" && !value.isCurrentMonth) {
      this.year = this.selectedDate.getUTCFullYear();
      this.month = this.selectedDate.getUTCMonth();
      this.updateCalendarDisplay();
    }
    this.updateFilteredEvents();
    this.saveSelectionToStorage();
  },

  hasEvent(value: number | Date | CalendarDay) {
    const date = this.resolveCalendarDate(value);
    return this.events.some((event) => isBoundaryDate(date, event));
  },

  setFilter(filter: string) {
    if (filter === "все") {
      this.activeFilters = [];
    } else {
      const idx = this.activeFilters.indexOf(filter);
      if (idx === -1) {
        this.activeFilters = [...this.activeFilters, filter];
      } else {
        this.activeFilters = this.activeFilters.filter((f) => f !== filter);
      }
    }
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

  hasCompletedRange() {
    return Boolean(
      this.rangeStartDate &&
        this.rangeEndDate &&
        !this.isSameDay(this.rangeStartDate, this.rangeEndDate),
    );
  },

  isSelectedDate(value: number | Date | CalendarDay) {
    if (this.hasCompletedRange() || this.isRangeSelecting) {
      return false;
    }
    return this.isSameDay(this.selectedDate, this.resolveCalendarDate(value));
  },

  // True only while the anchor date is awaiting a second tap — renders as the
  // half-circle "pending" marker instead of a confirmed full circle.
  isPendingRangeAnchor(value: number | Date | CalendarDay) {
    return Boolean(
      this.isRangeSelecting && this.isSameDay(this.rangeStartDate, this.resolveCalendarDate(value)),
    );
  },

  isRangeStart(value: number | Date | CalendarDay) {
    return this.isSameDay(this.rangeStartDate, this.resolveCalendarDate(value));
  },

  isRangeEnd(value: number | Date | CalendarDay) {
    return this.isSameDay(this.rangeEndDate, this.resolveCalendarDate(value));
  },

  isRangeBoundary(value: number | Date | CalendarDay) {
    if (this.isRangeSelecting) {
      return false;
    }
    return this.isRangeStart(value) || this.isRangeEnd(value);
  },

  isWithinSelectedRange(value: number | Date | CalendarDay) {
    if (!this.hasCompletedRange() || !this.rangeStartDate || !this.rangeEndDate) {
      return false;
    }
    const date = this.resolveCalendarDate(value);
    const time = date.getTime();
    return (
      time > this.rangeStartDate.getTime() && time < this.rangeEndDate.getTime()
    );
  },

  saveSelectionToStorage() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('maag_calendar', JSON.stringify({
      selectedDate: this.selectedDate?.toISOString() ?? null,
      rangeStartDate: this.rangeStartDate?.toISOString() ?? null,
      rangeEndDate: this.rangeEndDate?.toISOString() ?? null,
      viewYear: this.year,
      viewMonth: this.month,
    }));
  },

  restoreSelectionFromStorage() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('maag_calendar');
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved.selectedDate) return;
    this.selectedDate = new Date(saved.selectedDate);
    this.rangeStartDate = saved.rangeStartDate ? new Date(saved.rangeStartDate) : new Date(saved.selectedDate);
    this.rangeEndDate = saved.rangeEndDate ? new Date(saved.rangeEndDate) : null;
    this.year = saved.viewYear ?? this.year;
    this.month = saved.viewMonth ?? this.month;
  },

  setHoverDate(value: number | Date | CalendarDay) {
    if (!this.rangeStartDate || this.rangeEndDate) {
      this.hoverDate = null;
      return;
    }
    this.hoverDate = new Date(this.resolveCalendarDate(value));
  },

  clearHoverDate() {
    this.hoverDate = null;
  },

  isInHoverMode() {
    return Boolean(
      this.isRangeSelecting &&
        this.rangeStartDate &&
        !this.rangeEndDate &&
        this.hoverDate &&
        !this.isSameDay(this.rangeStartDate, this.hoverDate),
    );
  },

  isHoverEnd(value: number | Date | CalendarDay) {
    if (!this.isInHoverMode() || !this.hoverDate) return false;
    return this.isSameDay(this.resolveCalendarDate(value), this.hoverDate);
  },

  isHoverRangeStart(value: number | Date | CalendarDay) {
    if (!this.isInHoverMode() || !this.rangeStartDate || !this.hoverDate) return false;
    const lo =
      this.rangeStartDate.getTime() <= this.hoverDate.getTime()
        ? this.rangeStartDate
        : this.hoverDate;
    return this.isSameDay(this.resolveCalendarDate(value), lo);
  },

  isHoverRangeEnd(value: number | Date | CalendarDay) {
    if (!this.isInHoverMode() || !this.rangeStartDate || !this.hoverDate) return false;
    const hi =
      this.rangeStartDate.getTime() > this.hoverDate.getTime()
        ? this.rangeStartDate
        : this.hoverDate;
    return this.isSameDay(this.resolveCalendarDate(value), hi);
  },

  isWithinHoverRange(value: number | Date | CalendarDay) {
    if (!this.isInHoverMode() || !this.rangeStartDate || !this.hoverDate) return false;
    const time = this.resolveCalendarDate(value).getTime();
    const lo = Math.min(this.rangeStartDate.getTime(), this.hoverDate.getTime());
    const hi = Math.max(this.rangeStartDate.getTime(), this.hoverDate.getTime());
    return time > lo && time < hi;
  },

  getSelectedDateHeading() {
    if (!this.selectedDate) {
      return "";
    }

    return formatSelectedRangeHeading(this.rangeStartDate ?? this.selectedDate, this.rangeEndDate);
  },
});
