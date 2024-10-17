import { env } from "@strapi/utils";

const fullS3BucketUrl = `${env("AWS_BUCKET")}.s3.${env("AWS_REGION")}.localhost.localstack.cloud`;

export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            `${env("CDN_URL")}/`,
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            `${env("CDN_URL")}/`,
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
];
