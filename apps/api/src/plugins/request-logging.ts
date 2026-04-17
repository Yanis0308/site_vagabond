import { requestContext } from "@fastify/request-context";
import * as Sentry from "@sentry/node";
import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    // Fly-proxy strips inbound Fly-Client-IP and re-emits its own value, so this is the trustworthy client IP.
    clientIpAddress: string;
  }
}

function resolveClientIpAddress(request: FastifyRequest): string {
  const flyClientIp = request.headers["fly-client-ip"];
  const ip = Array.isArray(flyClientIp) ? flyClientIp[0] : flyClientIp;
  if (typeof ip === "string" && ip.length > 0) {
    return ip;
  }
  return request.ip;
}

export default fp(
  (fastify) => {
    fastify.decorateRequest("clientIpAddress", "");

    fastify.addHook("onRequest", (request: FastifyRequest, _reply, done) => {
      const clientIpAddress = resolveClientIpAddress(request);
      const userAgent = request.headers["user-agent"];

      request.clientIpAddress = clientIpAddress;
      request.log = request.log.child({
        client_ip_address: clientIpAddress,
        client_user_agent: userAgent,
      });
      requestContext.set("log", request.log);

      Sentry.setUser({ ip_address: clientIpAddress });
      Sentry.setContext("client", {
        client_ip_address: clientIpAddress,
        client_user_agent: userAgent,
      });

      done();
    });
  },
  {
    name: "request-logging",
    dependencies: ["request-context"],
  },
);
