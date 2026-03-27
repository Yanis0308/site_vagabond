import { type CollectionConfig } from "payload";

export const Villes: CollectionConfig = {
  slug: "villes",
  admin: {
    useAsTitle: "nom",
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nom", type: "text", required: true, localized: true },
    {
      name: "departement",
      type: "relationship",
      relationTo: "departements",
      required: true,
    },
    { name: "population", type: "number" },
    { name: "codeInsee", type: "text" },
    { name: "description", type: "richText", localized: true },
    {
      name: "descriptionSeo",
      type: "textarea",
      maxLength: 155,
      localized: true,
    },
    { name: "imageHero", type: "upload", relationTo: "media" },
    { name: "nbPois", type: "number", defaultValue: 0 },
    { name: "latitude", type: "number" },
    { name: "longitude", type: "number" },
  ],
};
