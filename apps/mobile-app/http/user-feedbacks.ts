import {
  type CreateUserFeedbackRequest,
  EmptyResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const createUserFeedback = async (
  body: CreateUserFeedbackRequest,
): Promise<void> => {
  const rawResult = await apiClient
    .post("api/user-feedbacks", { json: body })
    .json();

  if (!validateWithSchema(EmptyResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }
};
