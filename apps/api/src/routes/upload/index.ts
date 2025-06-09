import { Upload } from "@aws-sdk/lib-storage";
import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { jsonSchemas } from "@vagabond/shared-utils";
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
        response: {
          200: Type.Ref(jsonSchemas.UploadFileResponseSchema),
        },
      },
    },
    async function (request, reply) {
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

      // Remove all exif metadata but keep image orientation
      const editedBuffer = await sharp(fileBuffer).autoOrient().toBuffer();

      const hash = crypto
        .createHash("sha256")
        .update(editedBuffer)
        .digest("hex");

      const extension = data.filename.split(".").pop();
      const key = `${request.user.uid}-${hash}.${extension}`;

      const upload = new Upload({
        client: fastify.s3,
        params: {
          Bucket: fastify.config.s3.bucketName,
          Key: key,
          Body: editedBuffer,
          ContentType: data.mimetype,
        },
      });

      const uploadResult = await upload.done();

      return await reply.status(200).send({
        data: {
          key: uploadResult.Key ?? "",
          url: uploadResult.Location ?? "",
        },
      });
    },
  );
};

export default routes;
