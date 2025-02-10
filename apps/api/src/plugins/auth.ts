import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { type auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

declare module "fastify" {
  interface FastifyRequest {
    user: auth.DecodedIdToken;
  }
}

// Liste des chemins publics
const PUBLIC_PATHS: Array<string | RegExp> = [
  // String or RegExp
  //   "/api/health",
  //   /^\/api\/public\/.*/, // Tout ce qui commence par /api/public/
  /^\/documentation.*/,
];

export default fp(
  (fastify) => {
    fastify.addHook("onRequest", async (request: FastifyRequest) => {
      const isPublicPath = PUBLIC_PATHS.some((path) => {
        if (path instanceof RegExp) {
          return path.test(request.url);
        }
        return path === request.url;
      });

      if (isPublicPath) {
        return;
      }

      try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          throw new Error("Token manquant ou invalide");
        }

        const token = authHeader.split(" ")[1];
        if (token === undefined) {
          throw new Error("Token manquant ou invalide");
        }
        request.user = await getAuth().verifyIdToken(token);
      } catch (error) {
        // eslint-disable-next-line no-console -- TODO: remove
        console.error(error);
        throw fastify.httpErrors.unauthorized("Non autorisé");
      }

      const userId = request.user.uid;
      const currentUserInfo = {
        email: request.user.email,
        fullName:
          typeof request.user.name === "string" ? request.user.name : undefined,
        oauthProviders: Array.from(
          new Set([request.user.firebase.sign_in_provider]),
        ),
        lastLogin: new Date(),
      };

      // We don't await because we don't want to block the request
      void fastify.prisma.user
        .upsert({
          where: {
            id: userId,
          },
          create: {
            id: userId,
            ...currentUserInfo,
          },
          update: {
            ...currentUserInfo,
            oauthProviders: {
              set: await fastify.prisma.user
                .findUnique({
                  where: { id: userId },
                  select: { oauthProviders: true },
                })
                .then((previousUser) => {
                  return Array.from(
                    new Set([
                      ...(previousUser?.oauthProviders ?? []),
                      ...currentUserInfo.oauthProviders,
                    ]),
                  );
                }),
            },
          },
          select: { id: true },
        })
        .catch((error: unknown) => {
          // eslint-disable-next-line no-console -- TODO: remove
          console.error(error);
        });
    });
  },
  {
    name: "auth",
    dependencies: ["sensible", "firebase-admin", "fastify-prisma"],
  },
);
