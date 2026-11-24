import { defineConfig } from 'vitest/config';

// Ledger integration run against a real Firestore project, in a dedicated
// test collection. Kept out of `npm test`; run with
// `npm run test:integration:ledger`, which sets the required opt-in.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.integration.ts'],
    setupFiles: ['tests/integration/requireLedgerIntegration.ts'],
    environment: 'node',
    fileParallelism: false,
    // Real network round trips: the 20-attempt race test needs more than 5 s.
    testTimeout: 60_000,
  },
});
