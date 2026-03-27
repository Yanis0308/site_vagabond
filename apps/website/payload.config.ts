import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Articles } from "./collections/articles";
import { Categories } from "./collections/categories";
import { Departements } from "./collections/departements";
import { Media } from "./collections/media";
import { Regions } from "./collections/regions";
import { Users } from "./collections/users";
import { Villes } from "./collections/villes";
import { privateEnv } from "./lib/config/private";
import { DEFAULT_LOCALE, LOCALES } from "./lib/locales";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Regions,
    Departements,
    Villes,
    Categories,
    Articles,
  ],
  editor: lexicalEditor(),
  secret: privateEnv.payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp,
  db: postgresAdapter({
    pool: {
      connectionString: privateEnv.databaseUrl,
    },
    migrationDir: "./migrations",
  }),
});
