import type { Alpine } from 'alpinejs';

export default (Alpine: Alpine) => {
  console.log('Alpine entrypoint loaded!');
  Alpine.store('navbar', {
    isOpen: false,
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
    toggle() {
      this.isOpen = !this.isOpen;
    }
  });
};
