import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type CreateUserFeedbackRequest } from "@vagabond/shared-utils";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { createUserFeedback } from "@/http/user-feedbacks";
import { logger } from "@/utils/logger";

const USER_FEEDBACK_GENERIC_ERROR_MESSAGE =
  "Impossible d'envoyer pour le moment";
const UNKNOWN_APP_VERSION = "unknown";

type UserFeedbackMetadataKeys = "location" | "appVersion" | "os";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type CreateUserFeedbackInput = DistributiveOmit<
  CreateUserFeedbackRequest,
  UserFeedbackMetadataKeys
>;

export class UserFeedbackSubmissionError extends Error {
  public constructor(message: string = USER_FEEDBACK_GENERIC_ERROR_MESSAGE) {
    super(message);
    this.name = "UserFeedbackSubmissionError";
  }
}

const getAppVersion = (): string => {
  return Constants.expoConfig?.version ?? UNKNOWN_APP_VERSION;
};

const buildCreateUserFeedbackRequest = (
  input: CreateUserFeedbackInput,
  userLocation: ReturnType<typeof useUserLocation>["userLocation"],
): CreateUserFeedbackRequest => {
  return {
    ...input,
    location:
      userLocation === null
        ? undefined
        : {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
    appVersion: getAppVersion(),
    os: Platform.OS,
  };
};

const normalizeCreateUserFeedbackError = (
  error: unknown,
): UserFeedbackSubmissionError => {
  if (error instanceof UserFeedbackSubmissionError) {
    return error;
  }

  logger("Create user feedback mutation error:", error);

  return new UserFeedbackSubmissionError();
};

export const useCreateUserFeedback = (): UseMutationResult<
  void,
  UserFeedbackSubmissionError,
  CreateUserFeedbackInput
> => {
  const { userLocation } = useUserLocation();

  return useMutation({
    mutationKey: ["createUserFeedback"],
    retry: 0,
    mutationFn: async (input: CreateUserFeedbackInput): Promise<void> => {
      try {
        const body = buildCreateUserFeedbackRequest(input, userLocation);
        await createUserFeedback(body);
      } catch (error: unknown) {
        throw normalizeCreateUserFeedbackError(error);
      }
    },
  });
};
