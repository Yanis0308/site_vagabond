import { Upload } from "@aws-sdk/lib-storage";
import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { type VisitedPoiContext } from "@vagabond/database-client";
import {
  ErrorResponseSchema,
  UploadFileResponseSchema,
} from "@vagabond/shared-utils";
import crypto from "crypto";
import sharp from "sharp";

import { notifyPoiValidatedOnSlack } from "../../services/poi-validation-slack.service.js";

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

      // Verify ownership before uploading to avoid orphaned S3 objects.
      // Context (poiId, rating, comment, createdAt, imageKey) is reused for the Slack
      // notification below; imageKey gates against duplicate alerts on retried uploads.
      let visitedPoiContext: VisitedPoiContext | undefined;

      if (visitedPoiId !== undefined) {
        visitedPoiContext =
          await fastify.dbRepositories.visitedPoi.findContextByIdAndUser(
            visitedPoiId,
            request.user.uid,
          );

        if (visitedPoiContext === undefined) {
          return await reply.status(404).send({
            statusCode: 404,
            error: "Not Found",
            message: "Visited POI not found or does not belong to current user",
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

      if (visitedPoiId !== undefined && visitedPoiContext !== undefined) {
        const isFirstPhoto = visitedPoiContext.imageKey === null;

        await fastify.dbRepositories.visitedPoi.updateImageKey(
          visitedPoiId,
          finalKey,
        );

        // Only notify Slack on the first successful photo upload to avoid
        // duplicate alerts when the mobile background uploader retries.
        if (isFirstPhoto) {
          const contextForSlack = visitedPoiContext;
          void notifyPoiValidatedOnSlack(fastify, {
            visitedPoiId,
            poiId: contextForSlack.poiId,
            photoUrl: `${fastify.config.cdnUrl}/${finalKey}`,
            userDisplayName:
              request.user.db.nickname ?? request.user.db.fullName,
            userFullName: request.user.db.fullName,
            userEmail: request.user.email ?? "—",
            userId: request.user.uid,
            rating: contextForSlack.rating,
            comment: contextForSlack.comment,
            createdAt: contextForSlack.createdAt,
          });
        }
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
