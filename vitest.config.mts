import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // DB 통합 테스트는 로컬 Supabase가 필요하므로 `npm run test:db`로 따로 실행
    exclude: ["node_modules/**", ".next/**", "tests/database/**"],
  },
});
