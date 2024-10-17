import * as csvSync from "csv/sync";
import fs from "fs";

const sourceFile = "csv-files/geocoded_by_geoapify-13_09_2024, 02_36_48.csv";
const destinationFile = "csv-files/places-lat-long-geoapify.csv";

const records = csvSync.parse(fs.readFileSync(sourceFile), { columns: true });
const cleanedRecords = records.map((record: any) => ({
  latitude: record.lat,
  longitude: record.lon,
  markerColor: "",
  markerType: "",
  name: record.name,
}));
fs.writeFileSync(
  destinationFile,
  csvSync.stringify(cleanedRecords, { header: true }),
);
