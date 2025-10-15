import { eventsApi } from "@/lib/api/api";
import articleCreatorLogic from "@/components/article/creatorLogic";

type EventCategory = "exhibition" | "concert" | "performance";

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
    copy.isOnLanding = Boolean(copy.isOnLanding);
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
    return copy;
  };

  return {
    ...baseLogic,
    eventId,
    eventForm: {
      startDate: "",
      endDate: "",
      category: "" as EventCategory | "",
      isOnLanding: false,
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
          this.eventForm.category = normalized.category;
          this.eventForm.isOnLanding = Boolean(normalized.isOnLanding);
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
      if (this.eventForm.endDate && this.eventForm.endDate < value) {
        this.eventForm.endDate = value;
      }
    },

    setEndDate(value: string) {
      this.eventForm.endDate = value;
      if (value && value < this.eventForm.startDate) {
        this.eventForm.startDate = value;
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
      const end = this.eventForm.endDate ? new Date(this.eventForm.endDate) : null;

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
        category,
        tags: this.article.tags,
        techTags: this.article.techTags,
        startDate: this.eventForm.startDate,
        endDate: this.eventForm.endDate || null,
        isOnLanding: Boolean(this.eventForm.isOnLanding),
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
