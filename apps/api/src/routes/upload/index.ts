import { Upload } from "@aws-sdk/lib-storage";
import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  UploadFileResponseSchema,
} from "@vagabond/shared-utils";
import crypto from "crypto";
import sharp from "sharp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["upload"],
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        querystring: Type.Object({
          visitedPoiId: Type.Optional(Type.Number()),
        }),
        response: {
          200: UploadFileResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { visitedPoiId } = request.query;
      const data = await request.file();

      if (data === undefined) {
        throw new Error("No file uploaded");
      }

      if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      // data.toBuffer() can trigger global file size limit
      const fileBuffer = await data.toBuffer();
      if (fileBuffer.length >= MAX_FILE_SIZE || data.file.truncated) {
        throw new Error("File too large. Maximum size is 10MB.");
      }

      // Verify ownership before uploading to avoid orphaned S3 objects
      if (visitedPoiId !== undefined) {
        const visitedPoi =
          await fastify.dbRepositories.visitedPoi.findByIdAndUser(
            visitedPoiId,
            request.user.uid,
          );

        if (visitedPoi === undefined) {
          return await reply.status(404).send({
            error: {
              type: "NOT_FOUND",
              message:
                "Visited POI not found or does not belong to current user",
            },
          });
        }
      }

      // Remove EXIF metadata, keep orientation, always output JPEG.
      const editedBuffer = await sharp(fileBuffer)
        .autoOrient()
        .jpeg()
        .toBuffer();

      // visitedPoiId → deterministic key; otherwise SHA-256 of buffer to avoid collisions.
      const key =
        visitedPoiId !== undefined
          ? `${request.user.uid}-${visitedPoiId}.jpg`
          : `${request.user.uid}-${crypto.createHash("sha256").update(editedBuffer).digest("hex")}.jpg`;

      const upload = new Upload({
        client: fastify.s3,
        params: {
          Bucket: fastify.config.s3.bucketName,
          Key: key,
          Body: editedBuffer,
          ContentType: "image/jpeg",
        },
      });

      const uploadResult = await upload.done();

      if (uploadResult.Key === undefined) {
        throw new Error("Upload failed: missing storage key.");
      }
      const finalKey = uploadResult.Key;

      if (visitedPoiId !== undefined) {
        await fastify.dbRepositories.visitedPoi.updateImageKey(
          visitedPoiId,
          finalKey,
        );
      }

      return await reply.status(200).send({
        data: {
          key: finalKey,
          url: uploadResult.Location ?? "",
        },
      });
    },
  );
};

export default routes;
