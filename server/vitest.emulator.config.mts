import { defineConfig } from 'vitest/config';

// Tests that need the Firestore Emulator. Kept out of `npm test`
// (vitest.config.mts only picks up *.test.ts); run with `npm run test:emulator`.
export default defineConfig({
  test: {
    include: ['tests/emulator/**/*.emulator.ts'],
    setupFiles: ['tests/emulator/requireEmulator.ts'],
    environment: 'node',
    // One emulator, one database: files run one after another.
    fileParallelism: false,
  },
});
