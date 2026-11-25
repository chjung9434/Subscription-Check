import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 로컬 Supabase DB(npm run db:start && npm run db:reset) 대상 통합 테스트
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/database/**/*.test.ts"],
    fileParallelism: false,
  },
});
