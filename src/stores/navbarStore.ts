export const navbarStore = {
  isOpen: false,
  isScrolled: false,
  init() {
    if (typeof window === "undefined") {
      return;
    }

    const updateScrollState = () => {
      this.isScrolled = window.scrollY > 8;
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
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
