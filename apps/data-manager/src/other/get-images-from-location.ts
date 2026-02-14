// import * as csvSync from "csv/sync";
// import fs from "fs";
// import z from "zod";
// import ky from "ky";
// import { addCityInName } from "../utils";

// const sourceFile = "csv-files/places-full-geoapify.csv";
// const tmpFile = "csv-files/wiki/tmp-file.txt";
// // const destinationFile = "csv-files/wiki/place-full-geoapify-and-img.csv";

// const PlacesSchema = z.array(
//   z.object({
//     name: z.string(),
//     description: z.string(),
//     latitude: z.coerce.number(),
//     longitude: z.coerce.number(),
//   }),
// );

// const ResultSearchSchema = z.object({
//   query: z.object({
//     search: z.array(
//       z.object({
//         title: z.string(),
//         pageid: z.number(),
//         timestamp: z.string(),
//       }),
//     ),
//   }),
// });

// const places = PlacesSchema.parse(
//   csvSync.parse(fs.readFileSync(sourceFile), {
//     columns: true,
//   }),
// );

// const searchPagesResults = [];

// for (let i = 0; i < places.length; i++) {
//   console.log("place", i);
//   const searchPageResult = await ky
//     .get("https://commons.wikimedia.org/w/api.php", {
//       searchParams: {
//         action: "query",
//         format: "json",
//         list: "search",
//         srsearch: addCityInName(places[i]?.name ?? ""),
//         srnamespace: 6, // file type
//       },
//     })
//     .json();
//   searchPagesResults.push(searchPageResult);
//   // await sleep(100);
// }

// fs.appendFileSync(
//   tmpFile,
//   searchPagesResults
//     .map((searchResult) => JSON.stringify(searchResult))
//     .join("\n"),
// );

// const validResults = z.array(ResultSearchSchema).parse(searchPagesResults);

// const titlesQuery = validResults
//   .map((validResult) => validResult.query.search[0]?.title)
//   .join("|");

// console.log("titles", titlesQuery);

// const filesResults = await ky
//   .get("https://commons.wikimedia.org/w/api.php", {
//     searchParams: {
//       action: "query",
//       format: "json",
//       titles: titlesQuery,
//       prop: "imageinfo",
//       iiprop: "url",
//       iiurlwidth: "1000",
//       iiurlheight: "1000",
//     },
//   })
//   .json();

// // @ts-ignore
// fs.appendFileSync(tmpFile, filesResults);
