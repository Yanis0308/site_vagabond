import * as enums from "./enums.js";
import * as error from "./error.js";
import * as etl from "./etl.js";
import * as geo from "./geo.js";
import * as poi from "./poi/poi.js";
import * as primitive from "./primitive.js";
import * as response from "./response.js";
import * as visitedPoi from "./poi/visited-poi.js";
import * as metadata from "./metadata.js";

export const jsonSchemas = {
  ...enums,
  ...error,
  ...etl,
  ...geo,
  ...poi,
  ...visitedPoi,
  ...primitive,
  ...response,
  ...metadata,
};
