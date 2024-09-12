import type { Schema, Attribute } from '@strapi/strapi';

export interface GpsLocation extends Schema.Component {
  collectionName: 'components_gps_locations';
  info: {
    displayName: 'Location';
    icon: 'pinMap';
  };
  attributes: {
    latitude: Attribute.Float & Attribute.Required;
    longitude: Attribute.Float;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'gps.location': GpsLocation;
    }
  }
}
