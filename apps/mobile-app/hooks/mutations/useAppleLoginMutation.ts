import {
  type AndroidSigninResponse,
  appleAuth,
  appleAuthAndroid,
  type AppleRequestResponse,
} from "@invertase/react-native-apple-authentication";
import { AppleAuthProvider, getAuth } from "@react-native-firebase/auth";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { Platform } from "react-native";

import { config } from "@/constants/Config";
import { trackEvent } from "@/lib/analytics/analytics";
import { logger } from "@/utils/logger";

const iosFunction = async (nonce: string): Promise<AppleRequestResponse> => {
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    // Note: it appears putting FULL_NAME first is important, see issue #293
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    nonce,
  });
  logger("appleAuthRequestResponse", appleAuthRequestResponse);

  return appleAuthRequestResponse;
};

const androidFunction = async (
  nonce: string,
): Promise<AndroidSigninResponse> => {
  // const state = Math.random().toString(36).substring(2);

  // Configure the request
  appleAuthAndroid.configure({
    // The Service ID you registered with Apple
    clientId: config.appleSignInServiceId,
    // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
    // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
    redirectUri: config.appleSignInRedirectUrl,
    // The type of response requested - code, id_token, or both.
    responseType: appleAuthAndroid.ResponseType.ALL,
    // The amount of user information requested from Apple.
    scope: appleAuthAndroid.Scope.ALL,
    // Random nonce value that will be SHA256 hashed before sending to Apple.
    nonce,
    // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
    // state,
  });

  const appleAuthRequestResponse = await appleAuthAndroid.signIn();
  logger("appleAuthRequestResponse", appleAuthRequestResponse);

  // Open the browser window for user sign in
  return appleAuthRequestResponse;
};

export const useAppleLoginMutation = (): UseMutationResult<
  void,
  Error,
  void
> => {
  return useMutation({
    mutationFn: async () => {
      // Generate secure, random values for state and nonce, like an uuid
      const nonce = Math.random().toString(36).substring(2);
      let identityToken: string | null | undefined = null;

      if (Platform.OS === "ios") {
        const appleAuthRequestResponse = await iosFunction(nonce);
        identityToken = appleAuthRequestResponse.identityToken;
      } else if (Platform.OS === "android") {
        if (appleAuthAndroid.isSupported) {
          const appleAuthRequestResponse = await androidFunction(nonce);
          identityToken = appleAuthRequestResponse.id_token;
        } else {
          throw new Error("Apple authentication is not supported on Android");
        }
      }

      if (identityToken === null || identityToken === undefined) {
        throw new Error("No identity token found");
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- weird
      const appleCredential = AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      const userCredential =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- weird
        await getAuth().signInWithCredential(appleCredential);

      logger(
        `Firebase authenticated via Apple, UID: ${userCredential.user.uid}`,
      );
    },
    onSuccess: () => {
      logger("success apple login");
      void trackEvent("sign_in_succeeded", { method: "apple" });
    },
    onError: (error: Error) => {
      void trackEvent("sign_in_failed", {
        method: "apple",
        reason: error.message,
      });
    },
  });
};
