import { addressesApi, eventsApi } from "@/lib/api/api";
import articleCreatorLogic from "@/components/article/creatorLogic";
import { normalizeVideoBlock } from "@/lib/utils/video";
import {
  reindexContentBlocks,
  sortAndNormalizeContentBlocks,
  withBlockMeta,
} from "@/lib/utils/contentBlocks";
import { sanitizeRelatedContent } from "@/lib/utils/relatedContent";
import { createLandingPlacementManager } from "@/components/dashboard/landingPlacementManager";
import { normalizeContentCollectionId } from "@/lib/utils/contentCollections";
import { normalizeStoredRichTextHtml } from "@/lib/utils/richText";
import eventTagsData from "@/content/tags/EventTags.json";
import { normalizeTagList } from "@/content/tags/tags";

type EventDateType = "single" | "duration";
type EventTimeMode = "none" | "start" | "range";
type EventInfoIcon = "calendar" | "clock" | "location" | "bulb";

const EVENT_INFO_ICONS: EventInfoIcon[] = [
  "calendar",
  "clock",
  "location",
  "bulb",
];

const EVENT_TAGS: string[] = eventTagsData.eventTags;

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
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed
        : null;
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

const createInfoId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `info-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const normalizeInfoIcon = (value: unknown): EventInfoIcon => {
  return EVENT_INFO_ICONS.includes(value as EventInfoIcon)
    ? (value as EventInfoIcon)
    : "bulb";
};

const normalizeAdditionalInfo = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: any) => {
      const text = typeof item?.text === "string" ? item.text.trim() : "";
      if (!text) {
        return null;
      }
      const id =
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : createInfoId();

      return {
        id,
        icon: normalizeInfoIcon(item?.icon),
        text,
      };
    })
    .filter(Boolean);
};

export default function eventCreatorLogic(initialState = {}) {
  const baseLogic = articleCreatorLogic(initialState);

  const {
    eventId = null,
    isEditMode = false,
    isPreview = false,
    initialEvent = null,
    initialAddresses = [],
    ...restInitial
  } = initialState as {
    eventId?: string | null;
    isEditMode?: boolean;
    isPreview?: boolean;
    initialEvent?: Record<string, unknown> | null;
    initialAddresses?: Array<Record<string, unknown>>;
  };

  const normalizeIncoming = (input: any) => {
    if (!input || typeof input !== "object") {
      return null;
    }
    const copy = JSON.parse(JSON.stringify(input));
    copy.startDate = normalizeDate(copy.startDate);
    copy.endDate = normalizeDate(copy.endDate);
    copy.dateType = normalizeDateType(
      copy.dateType ?? (copy.endDate ? "duration" : "single"),
    );
    copy.timeMode = normalizeTimeMode(copy.timeMode);
    copy.startTime = normalizeTime(copy.startTime);
    copy.endTime = normalizeTime(copy.endTime);
    copy.address = typeof copy.address === "string" ? copy.address.trim() : "";
    copy.isMainEvent = Boolean(copy.isMainEvent);
    copy.additionalInfo = normalizeAdditionalInfo(copy.additionalInfo);
    const contentBlocks = Array.isArray(copy.contentBlocks)
      ? copy.contentBlocks
      : Array.isArray(copy.content)
        ? copy.content
        : [];
    copy.contentBlocks = sortAndNormalizeContentBlocks(contentBlocks).map(
      (block: any) =>
        block?.type === "video"
          ? withBlockMeta(
              normalizeVideoBlock(block) as Record<string, unknown>,
              Number(block.position) || 0,
            )
          : block,
    );
    copy.content = copy.contentBlocks;
    copy.tags = Array.isArray(copy.tags) ? copy.tags : [];
    copy.title = typeof copy.title === "string" ? copy.title : "";
    copy.imageUrl = typeof copy.imageUrl === "string" ? copy.imageUrl : "";
    copy.imageCaption =
      typeof copy.imageCaption === "string" ? copy.imageCaption : "";
    copy.lead = copy.lead ?? "";
    copy.leadHtml = normalizeStoredRichTextHtml(copy.leadHtml);
    copy.cardLead = copy.cardLead ?? "";
    copy.published = Boolean(copy.published);
    copy.publishedAt = copy.publishedAt ?? null;
    copy.relatedContent = sanitizeRelatedContent(copy.relatedContent);
    copy.contentCollectionId = normalizeContentCollectionId(
      copy.contentCollectionId,
    );
    return copy;
  };

  const normalizedInitialEvent = normalizeIncoming(initialEvent);
  const initialArticle = normalizedInitialEvent
    ? {
        ...baseLogic.article,
        ...normalizedInitialEvent,
        relatedContent: sanitizeRelatedContent(
          normalizedInitialEvent.relatedContent,
          "event",
          eventId,
        ),
      }
    : baseLogic.article;

  return {
    ...baseLogic,
    article: initialArticle,
    eventId,
    eventForm: {
      startDate: "",
      endDate: "",
      dateType: "single" as EventDateType,
      address: "",
      timeMode: "none" as EventTimeMode,
      startTime: "",
      endTime: "",
      isMainEvent: false,
      additionalInfo: [] as Array<{
        id: string;
        icon: EventInfoIcon;
        text: string;
      }>,
    },
    addressesLoading: false,
    addresses: initialAddresses as any[],
    selectedAddressId: "",
    useNewAddress: true,
    newAddressTitle: "",
    ...createLandingPlacementManager({
      getEntityId() {
        return this.eventId;
      },
      supportsEventCard: true,
    }),
    ...restInitial,
    addRelatedContent() {
      const type = this.selectedRelatedContentType;
      const id = this.selectedRelatedContentId;

      if (!type || !id) {
        return;
      }

      const normalized = sanitizeRelatedContent(this.article.relatedContent);
      if (this.eventId && type === "event" && id === this.eventId) {
        window.Alpine?.store("ui")?.showToast?.(
          "Нельзя привязать текущее событие к самому себе.",
          "error",
        );
        return;
      }
      if (normalized[type].includes(id)) {
        window.Alpine?.store("ui")?.showToast?.(
          "Этот материал уже добавлен.",
          "info",
        );
        return;
      }

      normalized[type] = [...normalized[type], id];
      this.article.relatedContent = normalized;
      this.selectedRelatedContentId = "";
    },

    init() {
      baseLogic.init?.call(this);

      const previewEvent = (() => {
        if (!isPreview) {
          return null;
        }
        try {
          const stored = window.localStorage?.getItem("eventPreview");
          const previewState = stored ? JSON.parse(stored) : null;
          const normalized = normalizeIncoming(previewState?.event);
          if (normalized) {
            this.eventId =
              typeof previewState?.eventId === "string"
                ? previewState.eventId
                : null;
            this.isEditMode = Boolean(previewState?.isEditMode);
            this.selectedAuthorId =
              typeof previewState?.selectedAuthorId === "string"
                ? previewState.selectedAuthorId
                : "";
            this.previewAuthorDisplay =
              previewState?.authorDisplay &&
              typeof previewState.authorDisplay === "object"
                ? {
                    name:
                      typeof previewState.authorDisplay.name === "string"
                        ? previewState.authorDisplay.name
                        : "",
                    avatarUrl:
                      typeof previewState.authorDisplay.avatarUrl === "string"
                        ? previewState.authorDisplay.avatarUrl
                        : "",
                  }
                : { name: "", avatarUrl: "" };
          }
          return normalized;
        } catch (error) {
          console.error("Failed to load event preview draft:", error);
          return null;
        }
      })();

      const eventDraft = previewEvent || normalizedInitialEvent;

      if (eventDraft) {
        this.article = { ...this.article, ...eventDraft };
        this.article.contentBlocks = Array.isArray(eventDraft.contentBlocks)
          ? eventDraft.contentBlocks
          : [];
        this.article.tags = Array.isArray(eventDraft.tags)
          ? eventDraft.tags
          : [];
        this.article.relatedContent = sanitizeRelatedContent(
          eventDraft.relatedContent,
          "event",
          this.eventId,
        );
        this.article.contentCollectionId = eventDraft.contentCollectionId;
        this.article.imageUrl = eventDraft.imageUrl;
        this.article.imageCaption = eventDraft.imageCaption ?? "";
        this.article.title = eventDraft.title ?? "";
        this.eventForm.startDate = eventDraft.startDate;
        this.eventForm.endDate = eventDraft.endDate;
        this.eventForm.dateType = eventDraft.dateType;
        this.eventForm.address = eventDraft.address;
        this.eventForm.timeMode = eventDraft.timeMode;
        this.eventForm.startTime = eventDraft.startTime;
        this.eventForm.endTime = eventDraft.endTime;
        this.eventForm.isMainEvent = Boolean(eventDraft.isMainEvent);
        this.eventForm.additionalInfo = Array.isArray(eventDraft.additionalInfo)
          ? eventDraft.additionalInfo
          : [];
        this.selectedAuthorId =
          this.selectedAuthorId ||
          (typeof eventDraft.authorId === "string" ? eventDraft.authorId : "");
        this.ensureSelectedAuthorPresent();
      }

      if (eventId) {
        this.eventId = eventId;
        this.isEditMode = true;
      }
      if (typeof isEditMode === "boolean") {
        this.isEditMode = isEditMode;
      }
      this.article.relatedContent = sanitizeRelatedContent(
        this.article.relatedContent,
        "event",
        this.eventId,
      );
      this.article.contentBlocks = Array.isArray(this.article.contentBlocks)
        ? reindexContentBlocks(this.article.contentBlocks)
        : [];

      this.loadAddresses();
    },

    returnToEdit() {
      window.location.href =
        this.isEditMode && this.eventId
          ? `/dashboard/event/${this.eventId}/edit`
          : "/dashboard/event/create";
    },

    previewEvent() {
      if (this.editingIndex !== null) {
        this.updateBlock();
        if (this.editingIndex !== null) return;
      }

      if (this.uploading) {
        window.Alpine.store("ui").showToast(
          "Подожди — загрузка файла ещё не завершилась.",
          "error",
        );
        return;
      }

      const authorDisplay = this.getSelectedAuthorDisplay();
      const previewState = {
        event: {
          ...this.article,
          ...this.eventForm,
        },
        eventId: this.eventId,
        isEditMode: this.isEditMode,
        selectedAuthorId: this.selectedAuthorId,
        authorDisplay,
      };
      window.localStorage.setItem("eventPreview", JSON.stringify(previewState));
      window.location.href = "/dashboard/event/preview";
    },

    getAvailableTags() {
      return normalizeTagList(EVENT_TAGS);
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

    getEventInfoOptions() {
      return [
        { value: "calendar", title: "Дата" },
        { value: "clock", title: "Время" },
        { value: "location", title: "Место" },
        { value: "bulb", title: "Идея" },
      ];
    },

    addEventInfo() {
      this.eventForm.additionalInfo = Array.isArray(
        this.eventForm.additionalInfo,
      )
        ? this.eventForm.additionalInfo
        : [];
      this.eventForm.additionalInfo.push({
        id: createInfoId(),
        icon: "bulb",
        text: "",
      });
    },

    removeEventInfo(index: number) {
      if (!Array.isArray(this.eventForm.additionalInfo)) {
        this.eventForm.additionalInfo = [];
        return;
      }
      this.eventForm.additionalInfo.splice(index, 1);
    },

    setEventInfoIcon(index: number, icon: EventInfoIcon) {
      if (!Array.isArray(this.eventForm.additionalInfo)) {
        return;
      }
      const block = this.eventForm.additionalInfo[index];
      if (!block) {
        return;
      }
      block.icon = normalizeInfoIcon(icon);
    },

    getAddressLabel(addressEntry: any) {
      return typeof addressEntry?.title === "string" ? addressEntry.title : "";
    },

    async loadAddresses() {
      this.addressesLoading = true;
      try {
        const addresses = await addressesApi.list();
        this.addresses = Array.isArray(addresses) ? addresses : [];
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        this.addressesLoading = false;
      }
    },

    applySelectedAddress() {
      const found = this.addresses.find(
        (addressEntry: any) => addressEntry.id === this.selectedAddressId,
      );
      if (found) {
        this.eventForm.address = found.address;
      }
    },

    async resolveAddress() {
      if (this.useNewAddress) {
        const text = (this.eventForm.address || "").trim();
        if (!text) {
          throw new Error("Укажи адрес события.");
        }
        const title = this.newAddressTitle.trim();
        if (title) {
          const createdAddress = await addressesApi.create({ title, address: text });
          this.addresses.unshift(createdAddress);
          this.selectedAddressId = createdAddress.id;
          this.newAddressTitle = "";
        }
        return text;
      }
      if (!this.selectedAddressId) {
        throw new Error("Выбери адрес из списка или впиши новый.");
      }
      const found = this.addresses.find(
        (addressEntry: any) => addressEntry.id === this.selectedAddressId,
      );
      return (found?.address || "").trim();
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

      const toast = (msg: string) =>
        (globalThis as any).Alpine.store("ui").showToast(msg, "error");

      const hasCover = Boolean(this.article.imageUrl);
      if (!hasCover) {
        toast("Загрузи обложку события — без неё никак.");
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
      const additionalInfo = normalizeAdditionalInfo(
        this.eventForm.additionalInfo,
      );

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
      if (!Array.isArray(this.article.tags) || this.article.tags.length === 0) {
        toast("Добавь хотя бы один тег.");
        this.isSaving = false;
        return;
      }

      this.article.contentBlocks = reindexContentBlocks(
        this.article.contentBlocks,
      ).map((block: any) =>
        block?.type === "video"
          ? withBlockMeta(
              normalizeVideoBlock(block) as Record<string, unknown>,
              Number(block.position) || 0,
            )
          : block,
      );

      try {
        const resolvedAuthorId = await this.resolveAuthorId();
        const resolvedAddress = await this.resolveAddress();
        const payload = {
          title: this.article.title,
          authorId: resolvedAuthorId,
          content: this.article.contentBlocks,
          imageUrl: this.article.imageUrl,
          imageCaption: this.article.imageCaption,
          lead: this.article.lead,
          leadHtml: normalizeStoredRichTextHtml(this.article.leadHtml),
          cardLead: this.article.cardLead,
          tags: this.article.tags,
          startDate: this.eventForm.startDate,
          endDate: normalizedEndDate,
          dateType: this.eventForm.dateType,
          address: resolvedAddress,
          timeMode,
          startTime: startTime || null,
          endTime: timeMode === "range" ? endTime : null,
          isMainEvent: Boolean(this.eventForm.isMainEvent),
          published: Boolean(this.article.published),
          additionalInfo,
          relatedContent: sanitizeRelatedContent(
            this.article.relatedContent,
            "event",
            this.eventId,
          ),
          contentCollectionId: normalizeContentCollectionId(
            this.article.contentCollectionId,
          ),
        };

        if (this.isEditMode && this.eventId) {
          await eventsApi.update(this.eventId, payload);
          window.localStorage.removeItem("eventPreview");
          (globalThis as any).Alpine.store("ui").showToast(
            "Событие обновлено, красота!",
          );
          setTimeout(() => {
            globalThis.location.href = "/dashboard/events";
          }, 1500);
        } else {
          const result = await eventsApi.create(payload);
          window.localStorage.removeItem("eventPreview");
          (globalThis as any).Alpine.store("ui").showToast(
            "Событие создано, поехали!",
          );
          setTimeout(() => {
            globalThis.location.href = `/dashboard/events`;
          }, 1500);
        }
      } catch (error) {
        console.error("Event save error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Что-то пошло не так при сохранении события.";
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
          window.Alpine.store("ui").showToast(
            "Не получилось удалить событие.",
            "error",
          );
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
