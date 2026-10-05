import { defineConfig } from "vitest/config";

// Pruebas unitarias (npm test). jsdom aporta localStorage, que usa `persist`.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
