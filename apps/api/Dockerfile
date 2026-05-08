FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# https://github.com/pnpm/pnpm/issues/9029
RUN npm i -g corepack@latest

# Préparer pnpm pendant le build plutôt qu'au runtime
# Copier uniquement package.json pour préparer pnpm avec la bonne version
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN corepack prepare pnpm@10.1.0 --activate

FROM base AS build
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run --filter @vagabond/api build
RUN pnpm deploy --filter @vagabond/api --prod /prod/api
# RUN ls -la /prod/api

FROM base AS api
# S'assurer que pnpm est préparé dans cette étape aussi
RUN corepack prepare pnpm@10.1.0 --activate
COPY --from=build /prod/api /prod/api
WORKDIR /prod/api
EXPOSE 3000
CMD ["pnpm", "start"]

