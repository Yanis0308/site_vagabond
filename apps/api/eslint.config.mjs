import rootConfig from "../../eslint.config.mjs";

export default [
  ...rootConfig,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        // Prevent direct fastify.log usage — use getLogger(fastify) or request.log instead
        {
          selector:
            "MemberExpression[object.name='fastify'][property.name='log']",
          message:
            "Utilise getLogger(fastify) depuis utils/logger.ts ou request.log à la place de fastify.log pour inclure le reqId et userId dans les logs.",
        },
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.type='ThisExpression'][object.property.name='fastify'][property.name='log']",
          message:
            "Utilise getLogger(this.fastify) depuis utils/logger.ts à la place de this.fastify.log pour inclure le reqId et userId dans les logs.",
        },
      ],
    },
  },
];
