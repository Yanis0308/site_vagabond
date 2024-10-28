import { env } from "@strapi/utils";
import appleSignin from "apple-signin-auth";
import jwt from "jsonwebtoken";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    strapi
      .plugin("users-permissions")
      .service("providers-registry")
      .add("apple", {
        icon: "apple",
        enabled: true,
        authCallback: async ({ accessToken, query: { platform } }) => {
          console.log("accessToken", accessToken);
          console.log("platform", platform);
          const clientId: string =
            platform === "android"
              ? env("APPLE_SIGN_IN_SERVICE_ID")
              : env("IOS_BUNDLE_ID");

          const privateKey = Buffer.from(
            env("APPLE_SIGN_IN_KEY_CONTENT_BASE64") as string,
            "base64",
          ).toString();
          console.log("privateKey", privateKey);

          const clientSecret = appleSignin.getClientSecret({
            clientID: clientId, // For iOS bundle id, for Android (WebView) service id
            teamID: env("APPLE_TEAM_ID"), // Apple Developer Team ID.
            keyIdentifier: env("APPLE_SIGN_IN_KEY_ID"), // identifier of the private key.
            privateKey: privateKey, // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
          });

          const options = {
            clientID: clientId, // Apple Client ID
            redirectUri: env("APPLE_SIGN_IN_REDIRECT_URL") as string, // use the same value which you passed to authorisation URL.
            clientSecret: clientSecret,
          };

          try {
            const tokenResponse = await appleSignin.getAuthorizationToken(
              accessToken,
              options,
            );
            console.log("tokenResponse", tokenResponse);
            if ("error" in tokenResponse) {
              throw new Error(tokenResponse.error as string);
            }

            const decoded = jwt.decode(tokenResponse.id_token);
            console.log("decoded", decoded);
            const email = decoded["email"];

            if (!email) {
              throw new Error("Email non disponible depuis Apple");
            }

            const username = email.split("@")[0];

            return {
              email,
              username,
              // This value is ignored by strapi, "apple" is deducted from provider given name
              // provider: "apple",
            };
          } catch (err) {
            console.error("Error in apple auth callback", err);
            throw err;
          }
        },
      });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
