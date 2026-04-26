import { eventsApi } from "@/lib/api/api";
import articleCreatorLogic from "@/components/article/creatorLogic";
import { normalizeVideoBlock } from "@/lib/utils/video";

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

const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = new Date(trimmed);
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
      const parsed = new Date(maybeSeconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof (value as { toDate?: () => Date }).toDate === "function") {
      const parsed = (value as { toDate: () => Date }).toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
  }

  return null;
};

const normalizeDate = (value?: unknown): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = toDate(value);
  if (!date) {
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
    copy.contentBlocks = contentBlocks.map((block: any) =>
      block?.type === "video" ? normalizeVideoBlock(block) : block,
    );
    copy.content = copy.contentBlocks;
    copy.tags = Array.isArray(copy.tags) ? copy.tags : [];
    copy.techTags = Array.isArray(copy.techTags) ? copy.techTags : [];
    copy.title = typeof copy.title === "string" ? copy.title : "";
    copy.imageUrl = typeof copy.imageUrl === "string" ? copy.imageUrl : "";
    copy.imageCaption = typeof copy.imageCaption === "string" ? copy.imageCaption : "";
    copy.lead = copy.lead ?? "";
    copy.cardLead = copy.cardLead ?? "";
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
      // Auto-commit any open block — prevents losing unsaved flipper/image/text edits
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      // Block save while a file upload is still in progress
      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

      // Guard against double-submit
      if (this.isSaving) return;
      this.isSaving = true;

      const toast = (msg: string) => (globalThis as any).Alpine.store("ui").showToast(msg, "error");

      const hasCover = Boolean(this.article.imageUrl);
      if (!hasCover) {
        toast("Загрузи обложку события — без неё никак.");
        this.isSaving = false;
        return;
      }

      const category = this.eventForm.category;
      if (!category) {
        toast("Выбери категорию события.");
        this.isSaving = false;
        return;
      }

      if (!this.article.title?.trim()) {
        toast("Напиши заголовок события.");
        this.isSaving = false;
        return;
      }

      if (!this.eventForm.startDate) {
        toast("Укажи дату начала события.");
        this.isSaving = false;
        return;
      }

      const start = new Date(this.eventForm.startDate);
      const isDuration = this.eventForm.dateType === "duration";
      if (isDuration && !this.eventForm.endDate) {
        toast("Для диапазона дат укажи дату окончания.");
        this.isSaving = false;
        return;
      }
      const normalizedEndDate = isDuration
        ? this.eventForm.endDate || this.eventForm.startDate
        : null;
      const end = normalizedEndDate ? new Date(normalizedEndDate) : null;

      if (Number.isNaN(start.getTime())) {
        toast("Нормально введи дату начала, она какая-то странная.");
        this.isSaving = false;
        return;
      }

      if (end && Number.isNaN(end.getTime())) {
        toast("Дата окончания введена криво.");
        this.isSaving = false;
        return;
      }

      if (end && end < start) {
        toast("Дата окончания не может быть раньше старта.");
        this.isSaving = false;
        return;
      }

      const timeMode = this.eventForm.timeMode;
      const startTime = normalizeTime(this.eventForm.startTime);
      const endTime = normalizeTime(this.eventForm.endTime);

      if (timeMode === "start" && !startTime) {
        toast("Укажи время начала события.");
        this.isSaving = false;
        return;
      }

      if (timeMode === "range") {
        if (!startTime || !endTime) {
          toast("Для диапазона времени укажи и начало, и конец.");
          this.isSaving = false;
          return;
        }
        if (endTime <= startTime) {
          toast("Конец временного диапазона должен быть позже начала.");
          this.isSaving = false;
          return;
        }
      }

      this.article.tags = this.article.tags ?? [];
      this.article.techTags = this.article.techTags ?? [];
      const hasTags = Array.isArray(this.article.tags) && this.article.tags.length > 0;
      const hasTechTags = Array.isArray(this.article.techTags) && this.article.techTags.length > 0;

      if (!hasTags && !hasTechTags) {
        toast("Добавь хотя бы один тег или техтег.");
        this.isSaving = false;
        return;
      }

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const payload = {
          title: this.article.title,
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          lead: this.article.lead,
          cardLead: this.article.cardLead,
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

        if (this.isEditMode && this.eventId) {
          await eventsApi.update(this.eventId, payload);
          (globalThis as any).Alpine.store("ui").showToast("Событие обновлено, красота!");
          const redirectTo = this.onSaveRedirect || `/dashboard/event/${this.eventId}/edit`;
          setTimeout(() => { globalThis.location.href = redirectTo; }, 1500);
        } else {
          const result = await eventsApi.create(payload);
          (globalThis as any).Alpine.store("ui").showToast("Событие создано, поехали!");
          setTimeout(() => { globalThis.location.href = `/events/${result.id}`; }, 1500);
        }
      } catch (error) {
        console.error("Event save error:", error);
        const message =
          error instanceof Error ? error.message : "Что-то пошло не так при сохранении события.";
        window.Alpine.store("ui").showToast(message, "error");
        this.isSaving = false;
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
