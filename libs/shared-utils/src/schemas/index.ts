import * as googleMapsPlace from "./api/google-maps-place.js";
import * as health from "./api/health.js";
import * as leaderboard from "./api/leaderboard.js";
import * as location from "./api/location.js";
import { PoiCategoryTypesSchema } from "./api/poi-categories.js";
import * as poiEnriched from "./api/poi-enriched.js";
import * as pushDevice from "./api/push-device.js";
import * as response from "./api/response.js";
import * as search from "./api/search.js";
import * as staffTools from "./api/staff-tools.js";
import * as upload from "./api/upload.js";
import * as user from "./api/user.js";
import * as userFeedback from "./api/user-feedback.js";
import * as visitedPoi from "./api/visited-poi.js";
import * as zones from "./api/zones.js";
import * as appState from "./app-state.js";
import * as enums from "./enums.js";
import * as error from "./error.js";
import * as etl from "./etl.js";
import * as jinaReader from "./external/jina-reader.js";
import * as jinaSearch from "./external/jina-search.js";
import * as geo from "./geo.js";
import * as metadata from "./metadata.js";
import * as primitive from "./primitive.js";
import * as llmProcessors from "./processors/llm.js";

export const allJsonSchemas = {
  ...staffTools,
  ...enums,
  ...error,
  ...etl,
  ...geo,
  ...googleMapsPlace,
  ...health,
  ...jinaReader,
  ...jinaSearch,
  PoiCategoryTypesSchema,
  ...poiEnriched,
  ...pushDevice,
  ...visitedPoi,
  ...user,
  ...userFeedback,
  ...zones,
  ...primitive,
  ...response,
  ...metadata,
  ...upload,
  ...leaderboard,
  ...location,
  ...search,
  ...llmProcessors,
  ...appState,
} as const;
