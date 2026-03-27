import { type CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "image/svg+xml",
      "application/pdf",
    ],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 800, height: 600, position: "centre" },
      { name: "hero", width: 1920, height: 1080, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
    ],
  },
  admin: {
    useAsTitle: "alt",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      localized: true,
    },
  ],
};
