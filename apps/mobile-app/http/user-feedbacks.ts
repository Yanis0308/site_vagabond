import {
  type CreateUserFeedbackRequest,
  EmptyResponseSchema,
  generateValidator,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

const validateEmptyResponse = generateValidator(EmptyResponseSchema);

export const createUserFeedback = async (
  body: CreateUserFeedbackRequest,
): Promise<void> => {
  const rawResult = await apiClient
    .post("api/user-feedbacks", { json: body })
    .json();

  if (!validateEmptyResponse(rawResult)) {
    throw new Error("Invalid response");
  }
};
