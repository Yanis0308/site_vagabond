# Dockerfile multi-stage pour `@vagabond/api`, basé sur `turbo prune`.
#
# Pourquoi `turbo prune` plutôt que `pnpm deploy` :
# - `pnpm deploy` requiert `inject-workspace-packages=true` (ou `--legacy`)
#   pour packager les workspace deps. On a retiré l'inject du `.npmrc` pour
#   que le watch dev fonctionne en symlinks.
# - `turbo prune --docker` génère un sous-monorepo minimal (`out/json` pour
#   les `package.json`, `out/full` pour le source code) qui s'installe
#   normalement avec pnpm. Aucune magie d'injection ; les symlinks resolvent
#   les workspace deps dans la stage runtime aussi bien qu'en dev.
# - Bonus : les Docker layers sont optimisés. La stage `deps` ne re-tourne que
#   si les `package.json` du sous-graphe changent, pas à chaque commit de code.

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# https://github.com/pnpm/pnpm/issues/9029
RUN npm i -g corepack@latest
COPY package.json ./
RUN corepack prepare pnpm@11.4.0 --activate

# 1. Prune : génère un sous-monorepo restreint à `@vagabond/api` + workspace deps.
FROM base AS pruner
COPY . /app
WORKDIR /app
RUN pnpm dlx turbo@2 prune @vagabond/api --docker

# 2. Deps : install complet (devDeps incluses) sur les `package.json` du sous-graphe.
#    Cette stage est cachée tant que les `package.json` ou le lockfile pruné ne
#    changent pas.
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Builder : ajoute le source code et build l'API + ses libs.
# Note : `turbo prune --docker` ne copie pas les fichiers root hors du graphe
# workspace (package.json/lockfile/turbo.json). On ramène manuellement
# `tsconfig.base.json` car les tsconfigs des libs l'étendent (sans lui,
# `skipLibCheck` disparaît et `tsc` part valider les types de typebox).
FROM deps AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
RUN pnpm exec turbo run build --filter=@vagabond/api

# 4. Runtime : réinstalle en `--prod` pour élaguer les devDeps du node_modules.
# `CI=true` : sinon pnpm 11 demande confirmation TTY avant de purger les
# devDeps héritées de la stage builder (ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY).
# `--ignore-scripts` : le script root `prepare` lance `husky` (devDep), qui
# disparaît avec la purge. Les postinstall des prod deps ont déjà tourné dans
# la stage `deps` et leurs artefacts sont intacts via les COPY successifs.
FROM base AS api
ENV CI=true
WORKDIR /app
COPY --from=builder /app .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "start"]
