import * as csvSync from "csv/sync";
import fs from "fs";
import { addCityInName } from "../utils";

const sourceFile = "csv-files/places-name-desc.csv";
const destinationFile = "csv-files/places-name-with-city.csv";

const records = csvSync.parse(fs.readFileSync(sourceFile), { columns: true });
const cleanedRecords = records.map((record: any) => ({
  name: addCityInName(record.name),
}));
fs.writeFileSync(
  destinationFile,
  csvSync.stringify(cleanedRecords, { header: true }),
);
