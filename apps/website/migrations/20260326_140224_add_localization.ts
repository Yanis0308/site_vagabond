import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Create the _locales ENUM type
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."_locales" AS ENUM('fr', 'en', 'de', 'nl', 'it', 'es', 'pt', 'zh', 'ja', 'pl', 'ko');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // 2. Create all *_locales tables

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "media_locales" (
      "alt" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "regions_locales" (
      "nom" varchar NOT NULL,
      "nom_complet" varchar,
      "description" jsonb,
      "description_seo" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "regions_top_pois_locales" (
      "nom" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "departements_locales" (
      "nom" varchar NOT NULL,
      "description" jsonb,
      "description_seo" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "villes_locales" (
      "nom" varchar NOT NULL,
      "description" jsonb,
      "description_seo" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "categories_locales" (
      "name" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "articles_locales" (
      "title" varchar NOT NULL,
      "excerpt" varchar,
      "content" jsonb NOT NULL,
      "meta_title" varchar,
      "meta_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "articles_faq_locales" (
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "articles_tags_locales" (
      "tag" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `);

  // 3. Copy existing data into _locales tables with _locale = 'fr'

  await db.execute(sql`
    INSERT INTO "media_locales" ("alt", "_locale", "_parent_id")
    SELECT "alt", 'fr', "id" FROM "media"
    WHERE "alt" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "regions_locales" ("nom", "nom_complet", "description", "description_seo", "_locale", "_parent_id")
    SELECT "nom", "nom_complet", "description", "description_seo", 'fr', "id" FROM "regions"
    WHERE "nom" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "regions_top_pois_locales" ("nom", "_locale", "_parent_id")
    SELECT "nom", 'fr', "id" FROM "regions_top_pois"
    WHERE "nom" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "departements_locales" ("nom", "description", "description_seo", "_locale", "_parent_id")
    SELECT "nom", "description", "description_seo", 'fr', "id" FROM "departements"
    WHERE "nom" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "villes_locales" ("nom", "description", "description_seo", "_locale", "_parent_id")
    SELECT "nom", "description", "description_seo", 'fr', "id" FROM "villes"
    WHERE "nom" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "categories_locales" ("name", "description", "_locale", "_parent_id")
    SELECT "name", "description", 'fr', "id" FROM "categories"
    WHERE "name" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "articles_locales" ("title", "excerpt", "content", "meta_title", "meta_description", "_locale", "_parent_id")
    SELECT "title", "excerpt", "content", "meta_title", "meta_description", 'fr', "id" FROM "articles"
    WHERE "title" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "articles_faq_locales" ("question", "answer", "_locale", "_parent_id")
    SELECT "question", "answer", 'fr', "id" FROM "articles_faq"
    WHERE "question" IS NOT NULL;
  `);

  await db.execute(sql`
    INSERT INTO "articles_tags_locales" ("tag", "_locale", "_parent_id")
    SELECT "tag", 'fr', "id" FROM "articles_tags"
    WHERE "tag" IS NOT NULL;
  `);

  // 4. Drop old columns from main tables

  await db.execute(sql`ALTER TABLE "media" DROP COLUMN IF EXISTS "alt";`);

  await db.execute(sql`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nom";`);
  await db.execute(
    sql`ALTER TABLE "regions" DROP COLUMN IF EXISTS "nom_complet";`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" DROP COLUMN IF EXISTS "description";`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" DROP COLUMN IF EXISTS "description_seo";`,
  );

  await db.execute(
    sql`ALTER TABLE "regions_top_pois" DROP COLUMN IF EXISTS "nom";`,
  );

  await db.execute(
    sql`ALTER TABLE "departements" DROP COLUMN IF EXISTS "nom";`,
  );
  await db.execute(
    sql`ALTER TABLE "departements" DROP COLUMN IF EXISTS "description";`,
  );
  await db.execute(
    sql`ALTER TABLE "departements" DROP COLUMN IF EXISTS "description_seo";`,
  );

  await db.execute(sql`ALTER TABLE "villes" DROP COLUMN IF EXISTS "nom";`);
  await db.execute(
    sql`ALTER TABLE "villes" DROP COLUMN IF EXISTS "description";`,
  );
  await db.execute(
    sql`ALTER TABLE "villes" DROP COLUMN IF EXISTS "description_seo";`,
  );

  await db.execute(sql`ALTER TABLE "categories" DROP COLUMN IF EXISTS "name";`);
  await db.execute(
    sql`ALTER TABLE "categories" DROP COLUMN IF EXISTS "description";`,
  );

  await db.execute(sql`ALTER TABLE "articles" DROP COLUMN IF EXISTS "title";`);
  await db.execute(
    sql`ALTER TABLE "articles" DROP COLUMN IF EXISTS "excerpt";`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" DROP COLUMN IF EXISTS "content";`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_title";`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_description";`,
  );

  await db.execute(
    sql`ALTER TABLE "articles_faq" DROP COLUMN IF EXISTS "question";`,
  );
  await db.execute(
    sql`ALTER TABLE "articles_faq" DROP COLUMN IF EXISTS "answer";`,
  );

  await db.execute(
    sql`ALTER TABLE "articles_tags" DROP COLUMN IF EXISTS "tag";`,
  );

  // 5. Add foreign keys and unique indexes on _locales tables

  await db.execute(sql`
    ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "regions_locales" ADD CONSTRAINT "regions_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "regions_top_pois_locales" ADD CONSTRAINT "regions_top_pois_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."regions_top_pois"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "departements_locales" ADD CONSTRAINT "departements_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."departements"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "villes_locales" ADD CONSTRAINT "villes_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."villes"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "articles_faq_locales" ADD CONSTRAINT "articles_faq_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_faq"("id") ON DELETE cascade ON UPDATE no action;
  `);
  await db.execute(sql`
    ALTER TABLE "articles_tags_locales" ADD CONSTRAINT "articles_tags_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_tags"("id") ON DELETE cascade ON UPDATE no action;
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "regions_locales_locale_parent_id_unique" ON "regions_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "regions_top_pois_locales_locale_parent_id_unique" ON "regions_top_pois_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "departements_locales_locale_parent_id_unique" ON "departements_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "villes_locales_locale_parent_id_unique" ON "villes_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_locales_locale_parent_id_unique" ON "articles_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_faq_locales_locale_parent_id_unique" ON "articles_faq_locales" USING btree ("_locale", "_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_tags_locales_locale_parent_id_unique" ON "articles_tags_locales" USING btree ("_locale", "_parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse: re-add columns to main tables, copy data back, drop locales tables

  await db.execute(
    sql`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "alt" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nom" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "nom_complet" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "description" jsonb;`,
  );
  await db.execute(
    sql`ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "description_seo" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "regions_top_pois" ADD COLUMN IF NOT EXISTS "nom" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "nom" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "description" jsonb;`,
  );
  await db.execute(
    sql`ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "description_seo" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "villes" ADD COLUMN IF NOT EXISTS "nom" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "villes" ADD COLUMN IF NOT EXISTS "description" jsonb;`,
  );
  await db.execute(
    sql`ALTER TABLE "villes" ADD COLUMN IF NOT EXISTS "description_seo" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "description" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "title" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "excerpt" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "content" jsonb;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_title" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_description" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles_faq" ADD COLUMN IF NOT EXISTS "question" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles_faq" ADD COLUMN IF NOT EXISTS "answer" varchar;`,
  );
  await db.execute(
    sql`ALTER TABLE "articles_tags" ADD COLUMN IF NOT EXISTS "tag" varchar;`,
  );

  // Copy French data back
  await db.execute(
    sql`UPDATE "media" m SET "alt" = l."alt" FROM "media_locales" l WHERE l."_parent_id" = m."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "regions" r SET "nom" = l."nom", "nom_complet" = l."nom_complet", "description" = l."description", "description_seo" = l."description_seo" FROM "regions_locales" l WHERE l."_parent_id" = r."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "regions_top_pois" r SET "nom" = l."nom" FROM "regions_top_pois_locales" l WHERE l."_parent_id" = r."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "departements" d SET "nom" = l."nom", "description" = l."description", "description_seo" = l."description_seo" FROM "departements_locales" l WHERE l."_parent_id" = d."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "villes" v SET "nom" = l."nom", "description" = l."description", "description_seo" = l."description_seo" FROM "villes_locales" l WHERE l."_parent_id" = v."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "categories" c SET "name" = l."name", "description" = l."description" FROM "categories_locales" l WHERE l."_parent_id" = c."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "articles" a SET "title" = l."title", "excerpt" = l."excerpt", "content" = l."content", "meta_title" = l."meta_title", "meta_description" = l."meta_description" FROM "articles_locales" l WHERE l."_parent_id" = a."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "articles_faq" f SET "question" = l."question", "answer" = l."answer" FROM "articles_faq_locales" l WHERE l."_parent_id" = f."id" AND l."_locale" = 'fr';`,
  );
  await db.execute(
    sql`UPDATE "articles_tags" t SET "tag" = l."tag" FROM "articles_tags_locales" l WHERE l."_parent_id" = t."id" AND l."_locale" = 'fr';`,
  );

  // Drop locales tables
  await db.execute(sql`
    DROP TABLE IF EXISTS "media_locales" CASCADE;
    DROP TABLE IF EXISTS "regions_locales" CASCADE;
    DROP TABLE IF EXISTS "regions_top_pois_locales" CASCADE;
    DROP TABLE IF EXISTS "departements_locales" CASCADE;
    DROP TABLE IF EXISTS "villes_locales" CASCADE;
    DROP TABLE IF EXISTS "categories_locales" CASCADE;
    DROP TABLE IF EXISTS "articles_locales" CASCADE;
    DROP TABLE IF EXISTS "articles_faq_locales" CASCADE;
    DROP TABLE IF EXISTS "articles_tags_locales" CASCADE;
    DROP TYPE IF EXISTS "public"."_locales";
  `);
}
