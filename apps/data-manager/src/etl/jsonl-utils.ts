import { logger } from "@vagabond/shared-utils";
import * as fs from "fs";
import { createReadStream, createWriteStream } from "fs";
import * as ndjson from "ndjson";
import { dirname } from "path";

import { type JsonlReader, type JsonlWriter } from "./types";

// Créer le répertoire data/ s'il n'existe pas
export function ensureDataDirectory(): void {
  const dataDir = "data";
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
} {
  const baseDir = "data";
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const transformDir = `${baseDir}/${schema}_${countryCode}_${timestamp}`;

  // S'assurer que le dossier de transformation existe
  if (!fs.existsSync(transformDir)) {
    fs.mkdirSync(transformDir, { recursive: true });
  }

  return {
    transformDir,
    pois: {
      filePath: `${transformDir}/pois.jsonl`,
      batchSize: 1000,
    },
    boundaries: {
      filePath: `${transformDir}/boundaries.jsonl`,
      batchSize: 500, // Plus petit batch à cause des géométries
    },
    associations: {
      filePath: `${transformDir}/associations.jsonl`,
      batchSize: 1000,
    },
    hierarchies: {
      filePath: `${transformDir}/hierarchies.jsonl`,
      batchSize: 1000,
    },
  };
}

// Fonction pour lister les dossiers de transformation disponibles
export function listAvailableTransformDirs(): string[] {
  const dataDir = "data";
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
  const baseDir = transformDir.startsWith("data/")
    ? transformDir
    : `data/${transformDir}`;

  if (!fs.existsSync(baseDir)) {
    throw new Error(`Dossier de transformation non trouvé: ${baseDir}`);
  }

  return {
    pois: `${baseDir}/pois.jsonl`,
    boundaries: `${baseDir}/boundaries.jsonl`,
    associations: `${baseDir}/associations.jsonl`,
    hierarchies: `${baseDir}/hierarchies.jsonl`,
  };
}

// Fonction pour obtenir le dossier de transformation le plus récent
export function getLatestTransformDir(): string | null {
  const dirs = listAvailableTransformDirs();
  return dirs.at(0) ?? null;
}
