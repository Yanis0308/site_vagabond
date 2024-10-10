import * as csvSync from "csv/sync";
import fs from "fs";

const sourceFile = "csv-files/places-geocoded.csv";
const destinationFile = "csv-files/places-lat-long.csv";

const records = csvSync.parse(fs.readFileSync(sourceFile), { columns: true });
const cleanedRecords = records.map((record: any) => ({
  latitude: record.latitude,
  longitude: record.longitude,
  markerColor: "",
  markerType: "",
  name: record.name,
}));
fs.writeFileSync(
  destinationFile,
  csvSync.stringify(cleanedRecords, { header: true }),
);
