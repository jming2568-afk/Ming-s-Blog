import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "../../packages/shared/src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.SQLITE_PATH ?? "file:./data/resume.db",
  },
});
