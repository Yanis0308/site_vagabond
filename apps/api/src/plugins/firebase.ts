import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import firebaseAdmin from "firebase-admin";
import { type App } from "firebase-admin/app";

// Strongly inspired by https://github.com/now-ims/fastify-firebase

declare module "fastify" {
  interface FastifyInstance {
    firebase: App;
  }
}

export default fp(
  function firebase(fastify: FastifyInstance) {
    const decoratorName = "firebase";
    // We need to check if this name is already being used

    if (fastify.hasDecorator(decoratorName)) {
      throw new Error(`The plugin ${decoratorName} is already registered`);
    }

    const appConfig = firebaseAdmin.credential.cert(
      fastify.config.firebaseAdminServiceAccountFilePath,
    );

    const firebaseApp = firebaseAdmin.initializeApp({
      credential: appConfig,
    });

    fastify.decorate(decoratorName, firebaseApp);
  },
  {
    name: "firebase-admin",
    dependencies: ["custom-config"],
  },
);
