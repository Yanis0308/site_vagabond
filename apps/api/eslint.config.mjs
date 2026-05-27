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

  // ───────────────────────────────────────────────────────────────────────────
  // `no-restricted-imports` pour les helpers `as{Mobile,DashboardBase,DashboardOrg}Request`
  // (cf. ADR 0009). 4 zones DISJOINTES (un fichier match EXACTEMENT un bloc) ;
  // chaque bloc liste ce qui est INTERDIT dans sa zone — le reste est autorisé.
  //
  // Zones (chaque bloc interdit ce qui n'est pas listé) :
  //   Z1 dashboard/orgs/** + auth-dashboard.ts + utils/dashboard-feature-gate.ts → tout autorisé
  //   Z2 dashboard/** (hors orgs)                                       → DashboardBase
  //   Z3 routes mobile + auth.ts                                        → Mobile
  //   Z4 reste                                                          → aucun helper
  //
  // Les helpers eux-mêmes sont implémentés en cast par intersection — la garde
  // réelle (JWT + scope) est portée par les plugins `auth*.ts` posés sur les
  // préfixes d'URL, pas par ces imports. ESLint sert juste à empêcher l'usage
  // hors zone par mégarde.
  // ───────────────────────────────────────────────────────────────────────────

  // Z1: routes org-scopées Dashboard + plugin auth-dashboard + helper
  // feature-gate (qui utilise asDashboardOrgRequest pour produire un preHandler).
  // Interdit seulement asMobileRequest.
  {
    files: [
      "src/routes/dashboard/orgs/**/*.ts",
      "src/plugins/auth-dashboard.ts",
      "src/utils/dashboard-feature-gate.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/types/mobile-request*"],
              importNames: ["asMobileRequest"],
              message:
                "asMobileRequest n'est utilisable que depuis les routes Mobile (src/routes/{users,visited-pois,user-feedbacks,zones,location,upload,staff-tools}/**) ou le plugin src/plugins/auth.ts.",
            },
          ],
        },
      ],
    },
  },

  // Z2: routes Dashboard hors orgs/**.
  {
    files: ["src/routes/dashboard/**/*.ts"],
    ignores: ["src/routes/dashboard/orgs/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/types/dashboard-request*"],
              importNames: ["asDashboardOrgRequest"],
              message:
                "asDashboardOrgRequest n'est utilisable que dans src/routes/dashboard/orgs/** (où le middleware charge `request.dashboardOrg`) ou dans src/plugins/auth-dashboard.ts.",
            },
            {
              group: ["**/types/mobile-request*"],
              importNames: ["asMobileRequest"],
              message:
                "asMobileRequest n'est utilisable que depuis les routes Mobile ou le plugin src/plugins/auth.ts.",
            },
          ],
        },
      ],
    },
  },

  // Z3: routes Mobile + plugin auth.ts (Firebase) — interdit les helpers Dashboard.
  {
    files: [
      "src/routes/users/**/*.ts",
      "src/routes/visited-pois/**/*.ts",
      "src/routes/user-feedbacks/**/*.ts",
      "src/routes/zones/**/*.ts",
      "src/routes/location/**/*.ts",
      "src/routes/upload/**/*.ts",
      "src/routes/staff-tools/**/*.ts",
      "src/routes/push-devices/**/*.ts",
      "src/routes/leaderboard/**/*.ts",
      "src/plugins/auth.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/types/dashboard-request*"],
              importNames: ["asDashboardBaseRequest", "asDashboardOrgRequest"],
              message:
                "Ces helpers ne peuvent être importés que depuis les routes Dashboard ou les plugins auth-dashboard*.",
            },
          ],
        },
      ],
    },
  },

  // Z4: tout le reste — interdit les trois helpers.
  {
    files: ["src/**/*.ts"],
    ignores: [
      "src/routes/dashboard/**/*.ts",
      "src/plugins/auth-dashboard.ts",
      "src/utils/dashboard-feature-gate.ts",
      "src/routes/users/**/*.ts",
      "src/routes/visited-pois/**/*.ts",
      "src/routes/user-feedbacks/**/*.ts",
      "src/routes/zones/**/*.ts",
      "src/routes/location/**/*.ts",
      "src/routes/upload/**/*.ts",
      "src/routes/staff-tools/**/*.ts",
      "src/routes/push-devices/**/*.ts",
      "src/routes/leaderboard/**/*.ts",
      "src/plugins/auth.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/types/dashboard-request*"],
              importNames: ["asDashboardBaseRequest", "asDashboardOrgRequest"],
              message:
                "Ces helpers ne peuvent être importés que depuis les routes Dashboard ou les plugins auth-dashboard*.",
            },
            {
              group: ["**/types/mobile-request*"],
              importNames: ["asMobileRequest"],
              message:
                "asMobileRequest n'est utilisable que depuis les routes Mobile ou le plugin src/plugins/auth.ts.",
            },
          ],
        },
      ],
    },
  },
];
