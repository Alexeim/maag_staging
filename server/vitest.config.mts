import { defineConfig } from 'vitest/config';

// Lives in server/ so the VS Code Vitest extension finds the backend tests
// inside this monorepo-style layout; the frontend has no Vitest setup.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
