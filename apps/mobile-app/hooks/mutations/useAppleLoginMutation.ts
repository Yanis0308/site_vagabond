import {
  AndroidSigninResponse,
  appleAuth,
  appleAuthAndroid,
  AppleRequestResponse,
} from "@invertase/react-native-apple-authentication";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { router } from "expo-router";
import { Platform } from "react-native";

import { config } from "@/constants/Config";
import { useSession } from "@/contexts/AuthContext";
import { loginWithApple } from "@/http/login";
import { logger } from "@/utils/logger";

const iosFunction = async (): Promise<AppleRequestResponse> => {
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    // Note: it appears putting FULL_NAME first is important, see issue #293
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });
  logger("appleAuthRequestResponse", appleAuthRequestResponse);

  return appleAuthRequestResponse;
};

const androidFunction = async (): Promise<AndroidSigninResponse> => {
  // Generate secure, random values for state and nonce, like an uuid
  const rawNonce = Math.random().toString(36).substring(2);
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
    nonce: rawNonce,
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
  const { signIn } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (Platform.OS === "ios") {
        const appleAuthRequestResponse = await iosFunction();
        const { jwt } = await loginWithApple(
          appleAuthRequestResponse.authorizationCode ?? "empty token",
        );
        signIn(jwt);
      } else if (Platform.OS === "android") {
        if (appleAuthAndroid.isSupported) {
          const appleAuthRequestResponse = await androidFunction();
          const { jwt } = await loginWithApple(appleAuthRequestResponse.code);
          signIn(jwt);
        } else {
          throw new Error("Apple authentication is not supported on Android");
        }
      }
    },
    onSuccess: () => {
      logger("success sign-in");
      router.replace("/");
    },
  });
};
