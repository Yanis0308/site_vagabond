import { Type } from "@sinclair/typebox";

import { ApiResponseSchema } from "../utils.js";

export const FileInfoSchema = Type.Object(
  {
    key: Type.String(),
    url: Type.String(),
  },
  { $id: "FileInfo" },
);

export const UploadFileResponseSchema = ApiResponseSchema(
  FileInfoSchema,
  "UploadFileResponse",
);
