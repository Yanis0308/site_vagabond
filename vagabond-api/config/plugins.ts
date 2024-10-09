import { env } from "@strapi/utils";

export default () => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        baseUrl: env("CDN_URL"),
        s3Options: {
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_ACCESS_SECRET"),
          },
          region: env("AWS_REGION"),
          params: {
            Bucket: env("AWS_BUCKET"),
          },
          // For local development only
          endpoint: env("AWS_PRIVATE_ENDPOINT"),
          forcePathStyle: env.bool("AWS_S3_FORCE_PATH_STYLE", false),
        },
      },
    },
  },
});
