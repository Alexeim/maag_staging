# Alpine.js Integration Guide for Mentormatic

This document outlines the correct way to use Alpine.js within the Mentormatic application, especially concerning the Astro View Transitions (`ClientRouter`) integration. Following these guidelines is crucial for building a performant, scalable, and stable frontend architecture.

## The Core Principle: Performance via On-Demand Loading

Our primary goal is performance. We achieve this through **code-splitting**. Instead of loading all JavaScript on every page, we load logic only when it's needed. This keeps the initial page load small and fast.

**DO NOT call `Alpine.start()` manually.** The Astro integration handles the entire lifecycle, including initialization on the first page load and re-initialization after every page transition.

## The Entrypoint: `src/entrypoint.ts` (For Globals Only)

This file is the entry point for **truly global** plugins and stores that are required on nearly every page.

-   **DO:** Use it for global plugins (e.g., `@alpinejs/intersect`).
-   **DO:** Use it for app-wide stores that need to persist across pages (e.g., a theme manager synced with `localStorage`).
-   **DO NOT:** Define single-use or component-specific logic here. This creates a monolithic bundle and slows down the site.

**Correct Example (`src/entrypoint.ts`):**
```typescript
import type { Alpine } from "alpinejs";
import intersect from "@alpinejs/intersect";

export default (Alpine: Alpine) => {
  // Register a global plugin needed on most pages
  Alpine.plugin(intersect);

  // Register a persistent global store
  Alpine.store('theme', {
    isDark: localStorage.getItem('isDark') === 'true',
    init() {
      Alpine.effect(() => {
        localStorage.setItem('isDark', this.isDark);
        if (this.isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
    },
    toggle() {
      this.isDark = !this.isDark;
    }
  });
};
```

## Defining Reusable Components: The On-Demand Pattern

This is the **standard pattern** for all non-trivial components. It ensures a component's logic is only downloaded by the browser when the component is actually present on the page.

The logic for a component is co-located with its Astro file and loaded dynamically via `x-init`.

### Step 1: Create a Co-located Logic File

For a component like `SignupForm.astro`, create a `logic.ts` file right next to it. This file exports a default function that registers the component with `Alpine.data`.

**`src/components/SignupForm/logic.ts`:**
```typescript
import type { Alpine } from 'alpinejs';

export default (Alpine: Alpine) => {
  Alpine.data('signupForm', () => ({
    step: 1,
    formData: { email: '', password: '' },
    nextStep() {
      console.log('Moving to next step...');
      this.step++;
    },
    // ... other complex logic
  }));
}
```

### Step 2: Load the Logic Dynamically from the Astro Component

In your Astro component, use `x-init` to dynamically `import()` the logic file. This registers the component just-in-time.

**`src/components/SignupForm/SignupForm.astro`:**
```astro
---
// This component has complex logic that we want to load on-demand.
---
<form
  x-data="signupForm"
  x-init={`
    if (typeof Alpine.store('signupFormInitialized') === 'undefined') {
      await (await import('./logic.ts')).default(Alpine);
      Alpine.store('signupFormInitialized', true);
    }
  `}
>
  <!-- Form content here -->
  <div x-show="step === 1">
    <label>Email</label>
    <input type="email" x-model="formData.email">
    <button @click.prevent="nextStep()">Next</button>
  </div>

  <div x-show="step === 2">
    <!-- ... -->
  </div>
</form>
```
**Note:** The `if` statement with an `Alpine.store` flag ensures the logic is only imported and registered once, even if multiple `SignupForm` components are on the same page.

## Usage Summary

### 1. Defining Local, Component-Specific State (For Simple Cases)

If a component requires simple, self-contained state that is **not** needed anywhere else, it is acceptable to define it directly in the `x-data` attribute.

**Correct Example:**
```html
<div x-data="{ open: false }">
  <button @click="open = !open">Menu</button>
  <div x-show="open">
    ...
  </div>
</div>
```

### 2. Accessing Global Stores

Use the `$store` magic property to access global state defined in `entrypoint.ts`.

**Correct Example:**
```html
<!-- In any .astro file -->
<body :class="{ 'dark': $store.theme.isDark }">
  <button @click="$store.theme.toggle()">
    Toggle Theme
  </button>
</body>
```

By following these patterns, we ensure our application remains fast, scalable, easy to debug, and fully compatible with Astro's View Transitions.
