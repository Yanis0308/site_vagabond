import * as csvSync from "csv/sync";
import fs from "fs";

const sourceFilePlaces = "csv-files/places-name-desc.csv";
const sourceFilePosition =
  "csv-files/geocoded_by_geoapify-13_09_2024, 02_36_48.csv";
const destinationFile = "csv-files/places-full-geoapify.csv";

const places = csvSync.parse(fs.readFileSync(sourceFilePlaces), {
  columns: true,
});
const positions = csvSync.parse(fs.readFileSync(sourceFilePosition), {
  columns: true,
});

const mergedPlaces = places.map((place: any, index: number) => ({
  ...place,
  latitude: positions[index].lat,
  longitude: positions[index].lon,
}));

fs.writeFileSync(
  destinationFile,
  csvSync.stringify(mergedPlaces, { header: true }),
);
