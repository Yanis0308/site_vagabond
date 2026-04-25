import { getAuth, GoogleAuthProvider } from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { config } from "@/constants/Config";
import { trackEvent } from "@/lib/analytics/analytics";
import { logger } from "@/utils/logger";

GoogleSignin.configure({
  // Web client ID needed for google sign in with firebase
  webClientId: config.googleSignInWebClientId, // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
  //   // scopes: ["https://www.googleapis.com/auth/drive.readonly"], // what API you want to access on behalf of the user, default is email and profile
  //   // offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  //   // hostedDomain: "", // specifies a hosted domain restriction
  //   // forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  //   // accountName: "", // [Android] specifies an account name on the device that should be used
  //   // iosClientId: "", // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  //   // googleServicePlistPath: "", // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
  //   // openIdRealm: "", // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  //   // profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});

export const useGoogleLoginMutation = (): UseMutationResult<
  void,
  Error,
  void
> => {
  return useMutation({
    mutationFn: async () => {
      try {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();

        if (isSuccessResponse(signInResult)) {
          const idToken = signInResult.data.idToken;

          if (idToken === null) {
            throw new Error("Google sign-in idToken is null");
          }

          // Create a Google credential with the token
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- weird
          const googleCredential = GoogleAuthProvider.credential(idToken);

          // Sign-in the user with the credential
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- weird
          await getAuth().signInWithCredential(googleCredential);
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
      logger("success google login");
      void trackEvent("sign_in_succeeded", { method: "google" });
    },
    onError: (error: Error) => {
      void trackEvent("sign_in_failed", {
        method: "google",
        reason: error.message,
      });
    },
  });
};
