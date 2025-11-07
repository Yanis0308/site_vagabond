import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { type auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

declare module "fastify" {
  interface FastifyRequest {
    user: auth.DecodedIdToken & {
      db: {
        id: string;
        email: string | null;
        fullName: string | null;
        oauthProviders: string[];
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

        // Ensure user exists and get the fresh DB record (awaited)
        const existingUser = await fastify.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, oauthProviders: true },
        });

        const dbUser = await fastify.prisma.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            ...currentUserInfo,
          },
          update: {
            ...currentUserInfo,
            oauthProviders: {
              set:
                existingUser !== null
                  ? Array.from(
                      new Set([
                        ...existingUser.oauthProviders,
                        ...currentUserInfo.oauthProviders,
                      ]),
                    )
                  : currentUserInfo.oauthProviders,
            },
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            oauthProviders: true,
            lastLogin: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Attach DB user to request.user
        request.user = Object.assign(decodedToken, { db: dbUser });

        // Fire-and-forget Slack notification for new user
        const isActuallyNewUser =
          dbUser.createdAt.getTime() === dbUser.updatedAt.getTime();

        if (isActuallyNewUser) {
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
    dependencies: ["sensible", "firebase-admin", "fastify-prisma", "slack"],
  },
);
