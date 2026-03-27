import { type CollectionConfig } from "payload";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "excerpt", type: "textarea", localized: true },
    { name: "content", type: "richText", required: true, localized: true },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    { name: "author", type: "text" },
    { name: "publishedAt", type: "date" },
    { name: "imageHero", type: "upload", relationTo: "media" },
    { name: "metaTitle", type: "text", localized: true },
    {
      name: "metaDescription",
      type: "textarea",
      maxLength: 155,
      localized: true,
    },
    {
      name: "faq",
      type: "array",
      fields: [
        { name: "question", type: "text", required: true, localized: true },
        { name: "answer", type: "textarea", required: true, localized: true },
      ],
    },
    {
      name: "tags",
      type: "array",
      fields: [{ name: "tag", type: "text", required: true, localized: true }],
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Brouillon", value: "draft" },
        { label: "Publié", value: "published" },
      ],
      defaultValue: "draft",
      required: true,
    },
  ],
};
