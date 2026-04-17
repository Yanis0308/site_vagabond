import { requestContext } from "@fastify/request-context";
import * as Sentry from "@sentry/node";
import { type User as SentryUser } from "@sentry/node";
import { type DbUser } from "@vagabond/database-client";
import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { type auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

import { captureAndLog } from "../utils/logger.js";

function buildSentryUserFromDecodedToken(
  userId: string,
  decodedToken: auth.DecodedIdToken,
  clientIpAddress: string,
): SentryUser {
  const email = decodedToken.email;

  return {
    id: userId,
    ip_address: clientIpAddress,
    ...(email !== undefined ? { email } : {}),
  };
}

function buildSentryUserFromDbAndToken(params: {
  userId: string;
  tokenEmail: string | undefined;
  dbEmail: string | null;
  nickname: string | null;
  fullName: string;
  clientIpAddress: string;
}): SentryUser {
  const { userId, tokenEmail, dbEmail, nickname, fullName, clientIpAddress } =
    params;

  const email = tokenEmail ?? dbEmail;

  const username = nickname ?? fullName;

  return {
    id: userId,
    ip_address: clientIpAddress,
    ...(email !== null ? { email } : {}),
    username,
  };
}

declare module "fastify" {
  interface FastifyRequest {
    user: auth.DecodedIdToken & {
      db: DbUser;
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

        Sentry.setUser(
          buildSentryUserFromDecodedToken(
            userId,
            decodedToken,
            request.clientIpAddress,
          ),
        );

        // Enrich log with user_id early so auth failures after this point carry the id.
        request.log = request.log.child({ user_id: userId });
        requestContext.set("log", request.log);

        // Ensure user exists and get the fresh DB record
        const { user: dbUser, isNew } =
          await fastify.dbRepositories.user.upsertUser(userId, currentUserInfo);

        // Attach DB user to request.user
        request.user = Object.assign(decodedToken, { db: dbUser });

        Sentry.setUser(
          buildSentryUserFromDbAndToken({
            userId,
            tokenEmail: decodedToken.email,
            dbEmail: dbUser.email,
            nickname: dbUser.nickname,
            fullName: dbUser.fullName,
            clientIpAddress: request.clientIpAddress,
          }),
        );

        Sentry.addBreadcrumb({
          category: "auth",
          message: isNew ? "New user signup" : "User authenticated",
          data: {
            userId,
            provider: decodedToken.firebase.sign_in_provider,
          },
        });

        // Enrich request.log with user info for all subsequent logs in this request
        request.log = request.log.child({
          user_id: userId,
          user_email: decodedToken.email ?? dbUser.email,
          user_nickname: dbUser.nickname,
          user_provider: decodedToken.firebase.sign_in_provider,
        });
        requestContext.set("log", request.log);

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
              request.log.info(
                `New user created: ${currentUserInfo.email} (${userId})`,
              );
            } catch (error) {
              captureAndLog(
                fastify,
                error,
                "Failed to send signup Slack notification",
                {
                  level: "warning",
                  tags: { operation: "slack-signup-notification" },
                },
              );
            }
          })();
        }
      } catch (error) {
        request.log.error(error);
        throw fastify.httpErrors.unauthorized("Non autorisé");
      }
    });
  },
  {
    name: "auth",
    dependencies: [
      "sensible",
      "firebase-admin",
      "fastify-drizzle",
      "slack",
      "request-context",
      "request-logging",
    ],
  },
);
