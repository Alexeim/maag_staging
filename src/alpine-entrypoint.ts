import type { Alpine } from 'alpinejs';
import { navbarStore } from '@/stores/navbarStore';
import lazyLoadPlugin from '@/lib/alpine/plugins/lazyLoadPlugin';

export default (Alpine: Alpine) => {
  console.log('Alpine entrypoint loaded!');
  
  Alpine.plugin(lazyLoadPlugin);
  Alpine.store('navbar', navbarStore);
};
