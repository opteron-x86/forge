import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    env: {
      AUTH_RATE_LIMIT: "10000",
      JWT_SECRET: "test-secret-do-not-use-in-production",
    },
  },
});
