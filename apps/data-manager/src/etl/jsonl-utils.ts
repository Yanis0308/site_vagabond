import { logger } from "@vagabond/shared-utils";
import * as fs from "fs";
import { createReadStream, createWriteStream } from "fs";
import * as ndjson from "ndjson";
import { dirname } from "path";

import { type JsonlReader, type JsonlWriter } from "./types";

// Créer le répertoire transform-output/ s'il n'existe pas
export function ensureDataDirectory(): void {
  const dataDir = "output";
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`Répertoire créé: ${dataDir}`);
  }
}

// Classe pour écrire en JSONL avec ndjson (plus robuste)
export class JsonlFileWriter<T> implements JsonlWriter<T> {
  private writeStream: fs.WriteStream;
  private stringify: ReturnType<typeof ndjson.stringify>;
  private writtenCount = 0;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;

    // S'assurer que le répertoire parent existe
    const dir = dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.writeStream = createWriteStream(filePath, { encoding: "utf8" });
    this.stringify = ndjson.stringify();
    this.stringify.pipe(this.writeStream);

    logger.info(`Écriture JSONL initialisée: ${filePath}`);
  }

  async write(record: T): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.stringify.write(record, (error) => {
        if (error instanceof Error) {
          reject(error);
        } else {
          this.writtenCount++;
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.stringify.end((error: Error | null | undefined) => {
        if (error instanceof Error) {
          reject(error);
        } else {
          logger.info(
            `Écriture JSONL terminée: ${this.writtenCount} enregistrements → ${this.filePath}`,
          );
          resolve();
        }
      });
    });
  }

  getWrittenCount(): number {
    return this.writtenCount;
  }
}

// Classe pour lire depuis JSONL avec ndjson (plus robuste)
export class JsonlFileReader<T> implements JsonlReader<T> {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier JSONL non trouvé: ${filePath}`);
    }
    logger.info(`Lecture JSONL initialisée: ${filePath}`);
  }

  async *read(): AsyncIterable<T> {
    const readStream = createReadStream(this.filePath, { encoding: "utf8" });
    const parseStream = ndjson.parse();

    // Pipeline pour parser les données
    const parsedStream = readStream.pipe(parseStream);

    let lineNumber = 0;
    for await (const record of parsedStream) {
      lineNumber++;
      try {
        yield record as T;
      } catch (error) {
        logger.error(`Erreur parsing ligne ${lineNumber}: ${String(error)}`);
        throw new Error(`Ligne JSON invalide ${lineNumber}: ${String(record)}`);
      }
    }
  }

  async close(): Promise<void> {
    // ndjson se ferme automatiquement
    await Promise.resolve();
    logger.info(`Lecture JSONL terminée: ${this.filePath}`);
  }
}

// Utilitaires pour générer les configurations de fichiers
export function generateTransformOutputFiles(
  schema: string,
  countryCode: string,
): {
  transformDir: string;
  pois: { filePath: string; batchSize: number };
  boundaries: { filePath: string; batchSize: number };
  associations: { filePath: string; batchSize: number };
  hierarchies: { filePath: string; batchSize: number };
  boundariesGeoJsonl: {
    country: { filePath: string };
    region: { filePath: string };
    county: { filePath: string };
    city: { filePath: string };
    district: { filePath: string };
    neighborhood: { filePath: string };
  };
} {
  const baseDir = "output";
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const transformDir = `${baseDir}/${schema}_${countryCode}_${timestamp}`;

  // S'assurer que le dossier de transformation existe
  if (!fs.existsSync(transformDir)) {
    fs.mkdirSync(transformDir, { recursive: true });
  }

  // Créer les sous-dossiers db et tileset
  const dbDir = `${transformDir}/db`;
  const geojsonDir = `${transformDir}/geojson`;

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(geojsonDir)) {
    fs.mkdirSync(geojsonDir, { recursive: true });
  }

  return {
    transformDir,
    pois: {
      filePath: `${dbDir}/pois.jsonl`,
      batchSize: 1000,
    },
    boundaries: {
      filePath: `${dbDir}/boundaries.jsonl`,
      batchSize: 500, // Plus petit batch à cause des géométries
    },
    associations: {
      filePath: `${dbDir}/associations.jsonl`,
      batchSize: 1000,
    },
    hierarchies: {
      filePath: `${dbDir}/hierarchies.jsonl`,
      batchSize: 1000,
    },
    boundariesGeoJsonl: {
      country: { filePath: `${geojsonDir}/boundaries-country.jsonl` },
      region: { filePath: `${geojsonDir}/boundaries-region.jsonl` },
      county: { filePath: `${geojsonDir}/boundaries-county.jsonl` },
      city: { filePath: `${geojsonDir}/boundaries-city.jsonl` },
      district: { filePath: `${geojsonDir}/boundaries-district.jsonl` },
      neighborhood: { filePath: `${geojsonDir}/boundaries-neighborhood.jsonl` },
    },
  };
}

// Fonction pour lister les dossiers de transformation disponibles
export function listAvailableTransformDirs(): string[] {
  const dataDir = "output";
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  return fs
    .readdirSync(dataDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort() // Plus récent en dernier
    .reverse(); // Plus récent en premier
}

// Fonction pour charger depuis un dossier de transformation spécifique
export function getTransformFiles(transformDir: string): {
  pois: string;
  boundaries: string;
  associations: string;
  hierarchies: string;
} {
  const baseDir = transformDir.startsWith("output/")
    ? transformDir
    : `output/${transformDir}`;

  if (!fs.existsSync(baseDir)) {
    throw new Error(`Dossier de transformation non trouvé: ${baseDir}`);
  }

  return {
    pois: `${baseDir}/db/pois.jsonl`,
    boundaries: `${baseDir}/db/boundaries.jsonl`,
    associations: `${baseDir}/db/associations.jsonl`,
    hierarchies: `${baseDir}/db/hierarchies.jsonl`,
  };
}
