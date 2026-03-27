import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { getPayload } from "payload";
import { fileURLToPath } from "url";

import config from "../payload.config";

interface CityData {
  name: string;
  population: number;
  lng: number;
  lat: number;
  dept: string | null;
  pois: number;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DEPT_NAME_TO_SLUG: Record<string, string> = {
  "Métropole de Lyon": "rhone",
  "Territoire-de-Belfort": "territoire-de-belfort",
};

function deptNameToSlug(name: string): string {
  return DEPT_NAME_TO_SLUG[name] ?? slugify(name);
}

async function seedVilles(): Promise<void> {
  const payload = await getPayload({ config });

  // Load departments
  console.log("Loading departments from Payload...");
  const allDepts = await payload.find({
    collection: "departements",
    limit: 200,
  });
  const deptMap = new Map<string, string | number>();
  for (const dept of allDepts.docs) {
    deptMap.set(dept.slug, dept.id);
  }
  console.log(`  ${String(deptMap.size)} departments loaded.\n`);

  // Load cities from JSON file
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const jsonPath = resolve(currentDir, "villes-data.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const cities = JSON.parse(raw) as CityData[];
  console.log(`Loaded ${String(cities.length)} cities from JSON.\n`);

  // Delete existing villes
  console.log("Clearing existing villes...");
  let totalDeleted = 0;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- loop until empty
  while (true) {
    const batch = await payload.find({ collection: "villes", limit: 100 });
    if (batch.docs.length === 0) break;
    for (const doc of batch.docs) {
      await payload.delete({ collection: "villes", id: doc.id });
    }
    totalDeleted += batch.docs.length;
    if (totalDeleted % 500 === 0) {
      console.log(`  Deleted ${String(totalDeleted)}...`);
    }
  }
  console.log(`  Cleared ${String(totalDeleted)} villes.\n`);

  // Insert cities
  console.log("Inserting cities...");
  const usedSlugs = new Set<string>();
  let inserted = 0;
  let skipped = 0;

  for (const city of cities) {
    if (city.dept === null) {
      skipped++;
      continue;
    }

    const deptSlug = deptNameToSlug(city.dept);
    const deptId = deptMap.get(deptSlug);
    if (deptId === undefined) {
      skipped++;
      continue;
    }

    let slug = slugify(city.name);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${deptSlug}`;
    }
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${String(inserted)}`;
    }
    usedSlugs.add(slug);

    try {
      await payload.create({
        collection: "villes",
        data: {
          slug,
          nom: city.name,
          departement: deptId as number,
          population: city.population,
          nbPois: city.pois,
          latitude: city.lat,
          longitude: city.lng,
        },
      });
      inserted++;
      if (inserted % 1000 === 0) {
        console.log(`  ${String(inserted)} inserted...`);
      }
    } catch {
      skipped++;
    }
  }

  console.log(
    `\nDone! ${String(inserted)} cities inserted, ${String(skipped)} skipped.`,
  );
  process.exit(0);
}

void seedVilles();
