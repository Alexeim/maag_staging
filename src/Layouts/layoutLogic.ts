declare const Alpine: any;

export default () => ({
  init() {
    // Close mobile menu on page navigation
    document.addEventListener('astro:after-swap', () => {
      const navbarStore = Alpine.store('navbar');
      if (navbarStore) {
        navbarStore.close();
      }
    });
  }
});
