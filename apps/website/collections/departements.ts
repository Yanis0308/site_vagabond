import { type CollectionConfig } from "payload";

export const Departements: CollectionConfig = {
  slug: "departements",
  admin: {
    useAsTitle: "nom",
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nom", type: "text", required: true, localized: true },
    { name: "numero", type: "text", required: true },
    {
      name: "region",
      type: "relationship",
      relationTo: "regions",
      required: true,
    },
    { name: "description", type: "richText", localized: true },
    {
      name: "descriptionSeo",
      type: "textarea",
      maxLength: 155,
      localized: true,
    },
    { name: "imageHero", type: "upload", relationTo: "media" },
    { name: "nbPois", type: "number", defaultValue: 0 },
  ],
};
