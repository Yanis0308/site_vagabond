import { type CollectionConfig } from "payload";

export const Regions: CollectionConfig = {
  slug: "regions",
  admin: {
    useAsTitle: "nom",
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nom", type: "text", required: true, localized: true },
    { name: "nomComplet", type: "text", localized: true },
    { name: "description", type: "richText", localized: true },
    {
      name: "descriptionSeo",
      type: "textarea",
      maxLength: 155,
      localized: true,
    },
    { name: "imageHero", type: "upload", relationTo: "media" },
    { name: "nbPois", type: "number", defaultValue: 0 },
    {
      name: "topPois",
      type: "array",
      fields: [
        { name: "nom", type: "text", required: true, localized: true },
        { name: "slug", type: "text", required: true },
      ],
    },
  ],
};
