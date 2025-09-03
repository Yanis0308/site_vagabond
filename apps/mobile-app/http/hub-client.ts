import { type KyInstance } from "ky";

import { httpClient } from "./http-client";

// Client HTTP pour Hub Toolforge - pas d'authentification nécessaire
export const hubClient: KyInstance = httpClient.extend({
  prefixUrl: "https://hub.toolforge.org",
});
