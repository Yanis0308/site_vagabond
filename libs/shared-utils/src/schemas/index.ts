import * as poi from "./api/poi.js";
import * as response from "./api/response.js";
import * as upload from "./api/upload.js";
import * as user from "./api/user.js";
import * as visitedPoi from "./api/visited-poi.js";
import * as enums from "./enums.js";
import * as error from "./error.js";
import * as etl from "./etl.js";
import * as geo from "./geo.js";
import * as metadata from "./metadata.js";
import * as primitive from "./primitive.js";

export const jsonSchemas = {
  ...enums,
  ...error,
  ...etl,
  ...geo,
  ...poi,
  ...visitedPoi,
  ...user,
  ...primitive,
  ...response,
  ...metadata,
  ...upload,
};
