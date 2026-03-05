import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { type auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

declare module "fastify" {
  interface FastifyRequest {
    user: auth.DecodedIdToken & {
      db: {
        userId: string;
        email: string | null;
        fullName: string;
        oauthProviders: string[] | null;
        lastLogin: Date;
        role: "ADMIN" | "USER";
        createdAt: Date;
        updatedAt: Date;
      };
    };
  }
}

// Liste des chemins publics
const PUBLIC_PATHS: Array<string | RegExp> = [
  // String or RegExp
  //   "/api/health",
  //   /^\/api\/public\/.*/, // All paths starting with /api/public/
  // /^\/documentation.*/, // Documentation if needed
  ///.*/, All for testing
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

        const decodedToken = await getAuth().verifyIdToken(token);

        // Build current user info from token
        const userId = decodedToken.uid;
        const currentUserInfo = {
          email: decodedToken.email ?? "",
          fullName:
            typeof decodedToken.name === "string" ? decodedToken.name : "",
          oauthProviders: Array.from(
            new Set([decodedToken.firebase.sign_in_provider]),
          ),
          lastLogin: new Date(),
        };

        // Ensure user exists and get the fresh DB record
        const { user: dbUser, isNew } =
          await fastify.dbRepositories.user.upsertUser(userId, currentUserInfo);

        // Attach DB user to request.user
        request.user = Object.assign(decodedToken, { db: dbUser });

        // Fire-and-forget Slack notification for new user
        if (isNew) {
          void (async (): Promise<void> => {
            try {
              await fastify.slack.sendSignupMessage(
                `🎉 *Nouvel utilisateur inscrit !*\n` +
                  `📧 *Email:* ${currentUserInfo.email}\n` +
                  `👤 *Nom:* ${currentUserInfo.fullName}\n` +
                  `🔑 *Provider:* ${currentUserInfo.oauthProviders.join(", ")}\n` +
                  `📅 *Date:* ${new Date().toLocaleString("fr-FR")}`,
              );
              fastify.log.info(
                `New user created: ${currentUserInfo.email} (${userId})`,
              );
            } catch (error) {
              fastify.log.error(error);
            }
          })();
        }
      } catch (error) {
        fastify.log.error(error);
        throw fastify.httpErrors.unauthorized("Non autorisé");
      }
    });
  },
  {
    name: "auth",
    dependencies: ["sensible", "firebase-admin", "fastify-drizzle", "slack"],
  },
);
