export const navbarStore = {
  isOpen: false,
  isScrolled: false,
  init() {
    if (typeof window === "undefined") {
      return;
    }

    const updateScrollState = () => {
      this.isScrolled = globalThis.scrollY > 8;
    };

    updateScrollState();
    globalThis.addEventListener("scroll", updateScrollState, { passive: true });
  },
  open() {
    this.isOpen = true;
  },
  close() {
    this.isOpen = false;
  },
  toggle() {
    this.isOpen = !this.isOpen;
  }
};
