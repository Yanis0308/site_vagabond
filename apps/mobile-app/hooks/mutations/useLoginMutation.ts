import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { router } from "expo-router";

import { config } from "@/constants/Config";
import { useSession } from "@/contexts/AuthContext";
import { loginWithGoogle } from "@/http/login";
import { logger } from "@/utils/logger";

GoogleSignin.configure({
  // webClientId: "<FROM DEVELOPER CONSOLE>", // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
  // scopes: ["https://www.googleapis.com/auth/drive.readonly"], // what API you want to access on behalf of the user, default is email and profile
  // offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  // hostedDomain: "", // specifies a hosted domain restriction
  // forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  // accountName: "", // [Android] specifies an account name on the device that should be used
  iosClientId: config.googleSignInIosClientId, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  // googleServicePlistPath: "", // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
  // openIdRealm: "", // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  // profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});

export const useLoginMutation = (): UseMutationResult<void, Error, void> => {
  const { signIn } = useSession();

  return useMutation({
    mutationFn: async () => {
      try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        if (isSuccessResponse(response)) {
          const { accessToken: googleAccessToken } =
            await GoogleSignin.getTokens();
          const { jwt } = await loginWithGoogle(googleAccessToken);
          signIn(jwt);
        } else {
          // sign in was cancelled by user
          logger("sign-in cancelled by user");
        }
      } catch (error) {
        logger("error with google sign-in", error);
        if (isErrorWithCode(error)) {
          switch (error.code) {
            case statusCodes.IN_PROGRESS:
              // operation (e.g. sign in) already in progress
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              // Android only, play services not available or outdated
              break;
            default:
            // some other error happened
          }
        } else {
          // an error that's not related to google sign in occurred
        }
        throw error;
      }
    },
    onSuccess: () => {
      logger("success sign-in");
      router.replace("/");
    },
  });
};
