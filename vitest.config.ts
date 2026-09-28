import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Frontend tests only; the backend has its own config in server/.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
