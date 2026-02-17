import { eventsApi } from "@/lib/api/api";
import articleCreatorLogic from "@/components/article/creatorLogic";

type EventCategory = "exhibition" | "concert" | "performance";
type EventDateType = "single" | "duration";
type EventTimeMode = "none" | "start" | "range";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  exhibition: "Выставка",
  concert: "Концерт",
  performance: "Спектакль",
};

const normalizeCategory = (value?: string | null): EventCategory | "" => {
  if (!value) {
    return "";
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "выставка") {
    return "exhibition";
  }
  if (trimmed === "концерт") {
    return "concert";
  }
  if (trimmed === "спектакль") {
    return "performance";
  }
  if ((Object.keys(CATEGORY_LABELS) as Array<EventCategory>).includes(value as EventCategory)) {
    return value as EventCategory;
  }
  return "";
};

const normalizeDate = (value?: string | Date | null): string => {
  if (!value) {
    return "";
  }
  const date = typeof value === "string" || value instanceof Date ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

const normalizeDateType = (value?: string | null): EventDateType => {
  if (value === "duration") {
    return "duration";
  }
  return "single";
};

const normalizeTimeMode = (value?: string | null): EventTimeMode => {
  if (value === "start" || value === "range") {
    return value;
  }
  return "none";
};

const normalizeTime = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : "";
};

export default function eventCreatorLogic(initialState = {}) {
  const baseLogic = articleCreatorLogic(initialState);

  const {
    eventId = null,
    isEditMode = false,
    onSaveRedirect = null,
    initialEvent = null,
    ...restInitial
  } = initialState as {
    eventId?: string | null;
    isEditMode?: boolean;
    onSaveRedirect?: string | null;
    initialEvent?: Record<string, unknown> | null;
  };

  const normalizeIncoming = (input: any) => {
    if (!input || typeof input !== "object") {
      return null;
    }
    const copy = JSON.parse(JSON.stringify(input));
    copy.category = normalizeCategory(copy.category);
    copy.startDate = normalizeDate(copy.startDate);
    copy.endDate = normalizeDate(copy.endDate);
    copy.dateType = normalizeDateType(copy.dateType ?? (copy.endDate ? "duration" : "single"));
    copy.timeMode = normalizeTimeMode(copy.timeMode);
    copy.startTime = normalizeTime(copy.startTime);
    copy.endTime = normalizeTime(copy.endTime);
    copy.address = typeof copy.address === "string" ? copy.address.trim() : "";
    copy.isOnLanding = Boolean(copy.isOnLanding);
    copy.isMainEvent = Boolean(copy.isMainEvent);
    const contentBlocks = Array.isArray(copy.contentBlocks)
      ? copy.contentBlocks
      : Array.isArray(copy.content)
        ? copy.content
        : [];
    copy.contentBlocks = contentBlocks;
    copy.content = contentBlocks;
    copy.tags = Array.isArray(copy.tags) ? copy.tags : [];
    copy.techTags = Array.isArray(copy.techTags) ? copy.techTags : [];
    copy.title = typeof copy.title === "string" ? copy.title : "";
    copy.imageUrl = typeof copy.imageUrl === "string" ? copy.imageUrl : "";
    copy.imageCaption = typeof copy.imageCaption === "string" ? copy.imageCaption : "";
    copy.lead = copy.lead ?? "";
    return copy;
  };

  return {
    ...baseLogic,
    eventId,
    eventForm: {
      startDate: "",
      endDate: "",
      dateType: "single" as EventDateType,
      address: "",
      timeMode: "none" as EventTimeMode,
      startTime: "",
      endTime: "",
      category: "" as EventCategory | "",
      isOnLanding: false,
      isMainEvent: false,
    },
    categoryLabels: CATEGORY_LABELS,
    ...restInitial,

    init() {
      baseLogic.init?.call(this);

      if (initialEvent) {
        const normalized = normalizeIncoming(initialEvent);
        if (normalized) {
          this.article = { ...this.article, ...normalized };
          this.article.contentBlocks = Array.isArray(normalized.contentBlocks)
            ? normalized.contentBlocks
            : [];
          this.article.tags = Array.isArray(normalized.tags) ? normalized.tags : [];
          this.article.techTags = Array.isArray(normalized.techTags)
            ? normalized.techTags
            : [];
          this.article.imageUrl = normalized.imageUrl;
          this.article.imageCaption = normalized.imageCaption ?? "";
          this.article.title = normalized.title ?? "";
          this.eventForm.startDate = normalized.startDate;
          this.eventForm.endDate = normalized.endDate;
          this.eventForm.dateType = normalized.dateType;
          this.eventForm.address = normalized.address;
          this.eventForm.timeMode = normalized.timeMode;
          this.eventForm.startTime = normalized.startTime;
          this.eventForm.endTime = normalized.endTime;
          this.eventForm.category = normalized.category;
          this.eventForm.isOnLanding = Boolean(normalized.isOnLanding);
          this.eventForm.isMainEvent = Boolean(normalized.isMainEvent);
        }
      }

      if (eventId) {
        this.eventId = eventId;
        this.isEditMode = true;
      }
      if (typeof isEditMode === "boolean") {
        this.isEditMode = isEditMode;
      }
      if (onSaveRedirect) {
        this.onSaveRedirect = onSaveRedirect;
      }
    },

    getAvailableTags() {
      const buckets = Object.values(this.categoryTags || {});
      return buckets.flat();
    },

    setCategory(value: string) {
      const normalized = normalizeCategory(value);
      this.eventForm.category = normalized;
    },

    setStartDate(value: string) {
      this.eventForm.startDate = value;
      if (
        this.eventForm.dateType === "duration" &&
        this.eventForm.endDate &&
        this.eventForm.endDate < value
      ) {
        this.eventForm.endDate = value;
      }
    },

    setEndDate(value: string) {
      this.eventForm.endDate = value;
      if (
        this.eventForm.dateType === "duration" &&
        value &&
        value < this.eventForm.startDate
      ) {
        this.eventForm.startDate = value;
      }
    },

    setDateType(value: EventDateType) {
      this.eventForm.dateType = value;
      if (value === "single") {
        this.eventForm.endDate = "";
      } else if (!this.eventForm.endDate && this.eventForm.startDate) {
        this.eventForm.endDate = this.eventForm.startDate;
      }
    },

    setTimeMode(value: EventTimeMode) {
      this.eventForm.timeMode = value;
      if (value === "none") {
        this.eventForm.startTime = "";
        this.eventForm.endTime = "";
      }
      if (value === "start") {
        this.eventForm.endTime = "";
      }
    },

    async saveEvent() {
      await this.saveArticle(); // Reuse validation for tags/image/title etc.
    },

    async saveArticle() {
      const hasCover = Boolean(this.article.imageUrl);
      if (!hasCover) {
        window.Alpine.store("ui").showToast(
          "Загрузи обложку события — без неё никак.",
          "error",
        );
        return;
      }

      const category = this.eventForm.category;
      if (!category) {
        window.Alpine.store("ui").showToast(
          "Выбери категорию события.",
          "error",
        );
        return;
      }

      if (!this.article.title?.trim()) {
        window.Alpine.store("ui").showToast(
          "Напиши заголовок события.",
          "error",
        );
        return;
      }

      if (!this.eventForm.startDate) {
        window.Alpine.store("ui").showToast(
          "Укажи дату начала события.",
          "error",
        );
        return;
      }

      const start = new Date(this.eventForm.startDate);
      const isDuration = this.eventForm.dateType === "duration";
      if (isDuration && !this.eventForm.endDate) {
        window.Alpine.store("ui").showToast(
          "Для диапазона дат укажи дату окончания.",
          "error",
        );
        return;
      }
      const normalizedEndDate = isDuration
        ? this.eventForm.endDate || this.eventForm.startDate
        : null;
      const end = normalizedEndDate ? new Date(normalizedEndDate) : null;

      if (Number.isNaN(start.getTime())) {
        window.Alpine.store("ui").showToast(
          "Нормально введи дату начала, она какая-то странная.",
          "error",
        );
        return;
      }

      if (end && Number.isNaN(end.getTime())) {
        window.Alpine.store("ui").showToast(
          "Дата окончания введена криво.",
          "error",
        );
        return;
      }

      if (end && end < start) {
        window.Alpine.store("ui").showToast(
          "Дата окончания не может быть раньше старта.",
          "error",
        );
        return;
      }

      const timeMode = this.eventForm.timeMode;
      const startTime = normalizeTime(this.eventForm.startTime);
      const endTime = normalizeTime(this.eventForm.endTime);

      if (timeMode === "start" && !startTime) {
        window.Alpine.store("ui").showToast(
          "Укажи время начала события.",
          "error",
        );
        return;
      }

      if (timeMode === "range") {
        if (!startTime || !endTime) {
          window.Alpine.store("ui").showToast(
            "Для диапазона времени укажи и начало, и конец.",
            "error",
          );
          return;
        }
        if (endTime <= startTime) {
          window.Alpine.store("ui").showToast(
            "Конец временного диапазона должен быть позже начала.",
            "error",
          );
          return;
        }
      }

      this.article.tags = this.article.tags ?? [];
      this.article.techTags = this.article.techTags ?? [];
      const hasTags = Array.isArray(this.article.tags) && this.article.tags.length > 0;
      const hasTechTags = Array.isArray(this.article.techTags) && this.article.techTags.length > 0;

      if (!hasTags && !hasTechTags) {
        window.Alpine.store("ui").showToast(
          "Добавь хотя бы один тег или техтег.",
          "error",
        );
        return;
      }

      const payload = {
        title: this.article.title,
        authorId: "HxpjsagLQxlUb2oCiM6h",
        content: this.article.contentBlocks,
        imageUrl: this.article.imageUrl,
        imageCaption: this.article.imageCaption,
        lead: this.article.lead,
        category,
        tags: this.article.tags,
        techTags: this.article.techTags,
        startDate: this.eventForm.startDate,
        endDate: normalizedEndDate,
        dateType: this.eventForm.dateType,
        address: this.eventForm.address?.trim() || "",
        timeMode,
        startTime: startTime || null,
        endTime: timeMode === "range" ? endTime : null,
        isOnLanding: Boolean(this.eventForm.isOnLanding),
        isMainEvent: Boolean(this.eventForm.isMainEvent),
      };

      try {
        if (this.isEditMode && this.eventId) {
          await eventsApi.update(this.eventId, payload);
          window.Alpine.store("ui").showToast("Событие обновлено, красота!");
          const redirectTo = this.onSaveRedirect || `/dashboard/event/${this.eventId}/edit`;
          window.location.href = redirectTo;
        } else {
          const result = await eventsApi.create(payload);
          window.Alpine.store("ui").showToast("Событие создано, поехали!");
          window.location.href = `/events/${result.id}`;
        }
      } catch (error) {
        console.error("Event save error:", error);
        const message =
          error instanceof Error ? error.message : "Что-то пошло не так при сохранении события.";
        window.Alpine.store("ui").showToast(message, "error");
      }
    },

    deleteEvent(redirectUrl: string) {
      if (!this.eventId) {
        return;
      }

      const performDelete = async () => {
        try {
          await eventsApi.delete(this.eventId as string);
          window.Alpine.store("ui").showToast("Событие удалено");
          setTimeout(() => {
            window.location.href = redirectUrl || "/dashboard/events";
          }, 1500);
        } catch (error) {
          console.error(error);
          window.Alpine.store("ui").showToast("Не получилось удалить событие.", "error");
        }
      };

      const uiStore = window.Alpine?.store?.("ui");
      if (uiStore?.showConfirmation) {
        uiStore.showConfirmation(
          `Удалить событие «${this.article.title || "без названия"}»? Это действие необратимо.`,
          performDelete,
        );
      } else if (window.confirm("Удалить событие? Это действие необратимо.")) {
        performDelete();
      }
    },
  };
}
