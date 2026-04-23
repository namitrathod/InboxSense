// prisma.config.ts
import { defineConfig } from "prisma/config";
import path from "node:path";

export default defineConfig({
    // Point to our schema
    schema: path.join("prisma", "schema.prisma"),

    // Define the database connection here instead of the schema
    datasource: {
        url: "file:./prisma/dev.db",
    },

    migrations: {
        path: "prisma/migrations",
    },
});
