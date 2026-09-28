import type { UiStore } from "@/stores/uiStore";

// Warns before leaving a dashboard editor with unsaved changes.
//
// Links inside the page (the editor's "Отмена", the dashboard sidebar, ...)
// open the dashboard's own ConfirmationModal. Closing the tab, reloading or
// typing another address can't show custom UI — browsers forbid it — so those
// fall back to the browser's generic "leave site?" dialog.
//
// The baseline is taken on the editor's first pointerdown/keydown, not on
// load: right after load the editor still normalizes its own data (e.g. Quill
// rewrites leadHtml on mount), which would otherwise look like an edit.
// Capture-phase listeners run before the handler that applies the edit, so the
// baseline is always the state the user started from.

export interface UnsavedChangesGuard {
  // Call after a successful save or delete: the current state becomes the
  // baseline, so the redirect that follows does not trigger the warning.
  markSaved(): void;
}

const LEAVE_MESSAGE = "Есть несохранённые изменения. Уйти без сохранения?";

// Returns the URL a plain left click on this link would navigate the current
// tab to, or null if the click opens elsewhere or stays on the page.
const getLeavingUrl = (event: MouseEvent): URL | null => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }
  const target = event.target;
  const link = target instanceof Element ? target.closest("a[href]") : null;
  if (!(link instanceof HTMLAnchorElement)) return null;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) {
    return null;
  }

  const url = new URL(link.href, globalThis.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const isSamePageAnchor =
    url.origin === globalThis.location.origin &&
    url.pathname === globalThis.location.pathname &&
    url.search === globalThis.location.search &&
    url.hash !== "";
  return isSamePageAnchor ? null : url;
};

export const createUnsavedChangesGuard = (
  root: HTMLElement,
  readState: () => unknown,
): UnsavedChangesGuard => {
  const serialize = (): string | null => {
    try {
      return JSON.stringify(readState());
    } catch {
      return null;
    }
  };

  let baseline: string | null = null;
  // Set once the user confirmed leaving in our modal, so the browser dialog
  // doesn't ask the same question a second time.
  let leaving = false;

  const hasUnsavedChanges = () =>
    !leaving && baseline !== null && serialize() !== baseline;

  const captureBaseline = () => {
    baseline ??= serialize();
  };
  root.addEventListener("pointerdown", captureBaseline, { capture: true });
  root.addEventListener("keydown", captureBaseline, { capture: true });

  document.addEventListener("click", (event: MouseEvent) => {
    if (!hasUnsavedChanges()) return;
    const url = getLeavingUrl(event);
    if (!url) return;

    const ui = (globalThis as any).Alpine?.store?.("ui") as UiStore | undefined;
    // Without the modal, let the browser dialog handle it.
    if (!ui?.showConfirmation) return;

    event.preventDefault();
    ui.showConfirmation(
      LEAVE_MESSAGE,
      () => {
        leaving = true;
        globalThis.location.href = url.href;
      },
      { confirmLabel: "Уйти без сохранения", cancelLabel: "Остаться" },
    );
  });

  globalThis.addEventListener("beforeunload", (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges()) return;
    // Browsers show their own generic dialog here; its text can't be set.
    // returnValue is deprecated but older Chrome/Safari still require it.
    event.preventDefault();
    event.returnValue = "";
  });

  return {
    markSaved() {
      baseline = serialize();
    },
  };
};
