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
        // Prevent usage of the staff-tools repository outside of the staff-tools routes/services.
        {
          selector: "MemberExpression[property.name='staffTools']",
          message:
            "Le repository staffTools est réservé aux routes/services staff-tools (dev-only).",
        },
      ],
      // Force toute lecture d'env var à passer par fastify.config (plugins/config.ts).
      // Cela évite la dispersion des process.env.* dans le code et garantit une
      // validation centralisée par Zod.
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "N'utilise pas process.env directement. Ajoute la variable au RawConfigSchema dans src/plugins/config.ts puis lis-la via fastify.config.",
        },
      ],
    },
  },
  {
    // Exceptions : config.ts est le SEUL endroit où on lit process.env (validation Zod) ;
    // logger.ts est évalué au niveau module avant que Fastify ne soit construit, donc
    // ne peut pas accéder à fastify.config.
    files: ["src/plugins/config.ts", "src/lib/logger.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
];
