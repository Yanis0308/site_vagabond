import type { Struct, Schema } from "@strapi/strapi";

export interface GpsLocation extends Struct.ComponentSchema {
  collectionName: "components_gps_locations";
  info: {
    displayName: "Location";
    icon: "pinMap";
  };
  attributes: {
    latitude: Schema.Attribute.Float & Schema.Attribute.Required;
    longitude: Schema.Attribute.Float;
  };
}

declare module "@strapi/strapi" {
  export module Public {
    export interface ComponentSchemas {
      "gps.location": GpsLocation;
    }
  }
}
