// Global type declarations for the browser runtime.
import type AlpineType from "alpinejs";
import type { AuthStore } from "@/stores/authStore";
import type { navbarStore } from "@/stores/navbarStore";
import type { UiStore } from "@/stores/uiStore";

// Types for the stores registered in src/alpine-entrypoint.ts, so that
// Alpine.store("ui") returns UiStore instead of unknown.
declare module "alpinejs" {
  namespace Alpine {
    interface Stores {
      ui: UiStore;
      auth: AuthStore;
      navbar: typeof navbarStore;
    }
  }
}

declare global {
  // @astrojs/alpinejs puts Alpine on the global object at runtime. A global
  // `var` (not `interface Window`) makes both globalThis.Alpine and
  // window.Alpine known to TypeScript.
  var Alpine: typeof AlpineType;
}
