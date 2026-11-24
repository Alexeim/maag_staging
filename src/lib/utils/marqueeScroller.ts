// Decorative card rails at the bottom of the landing, culture and paris pages.
//
// The viewport is a real horizontal scroller and the drift only moves its
// scrollLeft, so trackpads, Shift+wheel, touch swipes and keyboard focus all
// scroll it natively. A mouse drags it. The track holds the cards twice and
// scrollLeft is wrapped by the width of one copy, so the rail never runs out
// in either direction.
//
// Markup:
//   <div data-marquee data-marquee-duration="270">  ← viewport, overflow-x: auto
//     <div data-marquee-track>…cards…, …the same cards again…</div>
//   </div>
//
// data-marquee-duration: seconds the drift takes to pass one copy of the
// cards, the same number the old CSS animation used.

const VIEWPORT_SELECTOR = "[data-marquee]";
const TRACK_SELECTOR = "[data-marquee-track]";
const DEFAULT_DURATION_S = 240;
// After a touch swipe or a hand scroll the drift waits this long to resume.
const RESUME_DELAY_MS = 2500;
// A mouse press that moves less than this is a click, not a drag.
const DRAG_THRESHOLD_PX = 5;
// A longer gap between frames (background tab, debugger) is not caught up.
const MAX_FRAME_S = 0.1;
// Reading scrollLeft back can differ from what was written by rounding.
const OWN_WRITE_TOLERANCE_PX = 1.5;

interface DragState {
  pointerId: number;
  startX: number;
  startScroll: number;
  moved: boolean;
}

const setupMarquee = (viewport: HTMLElement): void => {
  if (viewport.dataset.marqueeReady === "true") return;
  const track = viewport.querySelector<HTMLElement>(TRACK_SELECTOR);
  if (!track) return;
  viewport.dataset.marqueeReady = "true";

  const duration =
    Number(viewport.dataset.marqueeDuration) || DEFAULT_DURATION_S;
  const autoplay = !window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;

  // Width of one copy of the cards, i.e. where the second copy starts.
  let loopWidth = 0;
  // Lowest scrollLeft the wrap keeps; above 0 so the left edge is never hit.
  let wrapStart = 0;
  // Kept as a float: the browser may round scrollLeft, and adding a fraction
  // of a pixel per frame to a rounded value would never move it.
  let position = 0;
  let lastWritten = -1;
  let isHovered = false;
  let hasFocus = false;
  let isVisible = true;
  let pausedUntil = 0;
  let lastFrame = 0;
  let drag: DragState | null = null;
  let suppressClick = false;

  const measure = (): void => {
    const cards = track.children;
    const half = Math.floor(cards.length / 2);
    const first = cards[0];
    const twin = cards[half];
    loopWidth =
      half > 0 && first instanceof HTMLElement && twin instanceof HTMLElement
        ? twin.offsetLeft - first.offsetLeft
        : 0;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    // [wrapStart, wrapStart + loopWidth) must fit inside [0, maxScroll].
    wrapStart = Math.max(1, Math.min(loopWidth / 2, maxScroll - loopWidth));
  };

  // Maps any scroll offset onto the same picture inside one copy.
  const normalize = (value: number): number => {
    if (loopWidth <= 0) return value;
    const offset = (value - wrapStart) % loopWidth;
    return wrapStart + (offset < 0 ? offset + loopWidth : offset);
  };

  const write = (value: number): void => {
    viewport.scrollLeft = value;
    lastWritten = viewport.scrollLeft;
  };

  const pauseForAWhile = (): void => {
    pausedUntil = performance.now() + RESUME_DELAY_MS;
  };

  measure();
  // normalize(0) lands on loopWidth: the first card at the left edge.
  position = normalize(0);
  write(position);

  const resizeObserver = new ResizeObserver(() => {
    measure();
    position = normalize(position);
    write(position);
  });
  resizeObserver.observe(viewport);
  resizeObserver.observe(track);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = Boolean(entry?.isIntersecting);
  });
  intersectionObserver.observe(viewport);

  // Any scroll we did not write ourselves is the reader's.
  viewport.addEventListener(
    "scroll",
    () => {
      const current = viewport.scrollLeft;
      if (Math.abs(current - lastWritten) <= OWN_WRITE_TOLERANCE_PX) return;
      if (!drag) pauseForAWhile();
      const wrapped = normalize(current);
      position = wrapped;
      if (Math.abs(wrapped - current) > OWN_WRITE_TOLERANCE_PX) {
        write(wrapped);
      } else {
        lastWritten = current;
      }
    },
    { passive: true },
  );

  viewport.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") isHovered = true;
  });
  viewport.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") isHovered = false;
  });

  // Tabbing through the card links stops the rail under the focus ring.
  viewport.addEventListener("focusin", () => {
    hasFocus = true;
  });
  viewport.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    hasFocus = next instanceof Node && viewport.contains(next);
  });

  viewport.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    if (event.pointerType !== "mouse") {
      // Touch and pen scroll natively; just hold the drift meanwhile.
      pauseForAWhile();
      return;
    }
    if (event.button !== 0) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: viewport.scrollLeft,
      moved: false,
    };
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset.dragging = "true";
    }
    const target = normalize(drag.startScroll - dx);
    // When the wrap jumps by one copy, move the drag origin with it.
    drag.startScroll = target + dx;
    position = target;
    write(target);
  });

  const endDrag = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      // The release after a drag must not open the card under the cursor.
      suppressClick = true;
      delete viewport.dataset.dragging;
    }
    drag = null;
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("lostpointercapture", endDrag);

  viewport.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  // Links and images are natively draggable; that ghost drag would cancel
  // the pointer events and leave the rail stuck mid-drag.
  viewport.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  if (!autoplay) return;

  const frame = (now: number): void => {
    // The page was swapped (ClientRouter) or the rail removed: stop for good.
    if (!viewport.isConnected) {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      return;
    }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, MAX_FRAME_S) : 0;
    lastFrame = now;

    const paused =
      isHovered ||
      hasFocus ||
      drag !== null ||
      now < pausedUntil ||
      !isVisible ||
      loopWidth <= 0;

    if (!paused) {
      // Cards travel left to right, as with the old CSS animation.
      position = normalize(position - (loopWidth / duration) * dt);
      write(position);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

export const initMarquees = (): void => {
  document
    .querySelectorAll<HTMLElement>(VIEWPORT_SELECTOR)
    .forEach(setupMarquee);
};
