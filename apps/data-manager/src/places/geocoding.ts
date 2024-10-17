import * as csvSync from "csv/sync";
import fs from "fs";
import { z } from "zod";
import NodeGeocoder from "node-geocoder";
import node_geocoder from "node-geocoder";
import { sleep } from "../utils";

const sourceFile = "csv-files/places-name-desc.csv";
const destinationFile = "csv-files/places-geocoded.csv";

const PlaceNameDesc = z.object({
  name: z.string(),
  description: z.string(),
});

const geocoderOptions = {
  provider: "yandex",
};

const geocoder = NodeGeocoder(<node_geocoder.Options>geocoderOptions);

// Fonction pour découper les requêtes en chunks
function chunkArray<T>(array: T[], chunkSize: number): Array<Array<T>> {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Lire et parser le fichier CSV
const records = z.array(PlaceNameDesc).parse(
  csvSync.parse(fs.readFileSync(sourceFile), {
    columns: ["name", "description"],
  }),
);

// Fonction pour géocoder en respectant la limite de 50 requêtes par seconde
async function processInChunks(
  records: z.infer<typeof PlaceNameDesc>[],
  chunkSize: number,
  delay: number,
) {
  const chunks = chunkArray(records, chunkSize);
  const results = [];

  for (const chunk of chunks) {
    const geocodingPromises = chunk.map(async (record) => {
      const newName = `${record.name}${record.name.toLowerCase().includes("lille") ? "" : " lille"}`;
      console.log(newName);
      const geoData = await geocoder.geocode(newName);
      const correctGeoData = geoData.find((data) =>
        JSON.stringify(data).includes("Hauts-de-France"),
      );
      return correctGeoData ? { ...record, ...correctGeoData } : undefined;
    });

    const chunkResults = await Promise.all(geocodingPromises);
    results.push(...chunkResults);

    // Attendre 1 seconde avant de traiter le prochain chunk
    await sleep(delay);
  }

  return results;
}

// Traiter les requêtes par chunks de 50 et écrire dans le fichier de destination
(async () => {
  const values = await processInChunks(records, 10, 1000); // 50 requêtes par chunk, 1 seconde de délai entre chaque chunk
  fs.writeFileSync(
    destinationFile,
    csvSync.stringify(
      values.filter((data) => data != undefined),
      { header: true },
    ),
  );
})();
