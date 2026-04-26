import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type LocaleTree = Record<string, unknown>;

const LOCALES_DIR = join(__dirname, "..", "localization", "locales");

const collectLeafPaths = (tree: LocaleTree, prefix = ""): string[] => {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value as LocaleTree, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
};

const loadLocale = (locale: string, namespace: string): Set<string> | null => {
  const filePath = join(LOCALES_DIR, locale, `${namespace}.json`);
  if (!existsSync(filePath)) return null;
  const tree = JSON.parse(readFileSync(filePath, "utf-8")) as LocaleTree;
  return new Set(collectLeafPaths(tree));
};

const diff = (a: Set<string>, b: Set<string>): string[] => {
  return [...a].filter((key) => !b.has(key)).sort();
};

const locales = readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (locales.length < 2) {
  console.log(
    `i18n-check: only ${locales.length} locale(s) found, nothing to compare.`,
  );
  process.exit(0);
}

const namespaces = new Set<string>();
for (const locale of locales) {
  for (const file of readdirSync(join(LOCALES_DIR, locale))) {
    if (file.endsWith(".json")) namespaces.add(file.replace(/\.json$/, ""));
  }
}

let hasError = false;

for (const namespace of [...namespaces].sort()) {
  const keysByLocale = new Map<string, Set<string>>();
  const allKeys = new Set<string>();
  const missingFiles: string[] = [];

  for (const locale of locales) {
    const keys = loadLocale(locale, namespace);
    if (keys === null) {
      missingFiles.push(locale);
      continue;
    }
    keysByLocale.set(locale, keys);
    for (const key of keys) allKeys.add(key);
  }

  for (const locale of missingFiles) {
    hasError = true;
    console.error(
      `\n[i18n-check] file missing: "${locale}/${namespace}.json" (exists in other locales).`,
    );
  }

  for (const [locale, localeKeys] of keysByLocale) {
    const missing = diff(allKeys, localeKeys);
    if (missing.length > 0) {
      hasError = true;
      console.error(
        `\n[i18n-check] ${missing.length} key(s) missing in "${locale}/${namespace}.json":`,
      );
      for (const key of missing) console.error(`  - ${key}`);
    }
  }
}

if (hasError) {
  console.error(
    "\ni18n-check failed: locales are out of sync. Add the missing keys above to keep them aligned.",
  );
  process.exit(1);
}

console.log(
  `i18n-check: all ${locales.length} locales aligned across ${namespaces.size} namespace(s).`,
);
