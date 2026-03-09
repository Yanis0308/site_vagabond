import rootConfig from "../../eslint.config.mjs";

export default [
  ...rootConfig,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        // Inherited from root config
        {
          selector: "TaggedTemplateExpression[typeArguments]",
          message:
            "N'utilise pas sql<T>. Utilise .mapWith(Number), .mapWith(String), etc. à la place pour une conversion runtime.",
        },
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
