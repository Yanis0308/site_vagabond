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
RUN pnpm exec turbo run build --filter=@vagabond/data-scraper
RUN pnpm deploy --filter @vagabond/data-scraper --prod /prod/data-scraper

# Use Puppeteer base image for runtime
FROM ghcr.io/puppeteer/puppeteer:latest AS data-scraper

# Install Node.js and pnpm in Puppeteer image
USER root
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.1.0 --activate

# Copy deployed application from build stage (only production files, no devDependencies)
COPY --from=build /prod/data-scraper /app
WORKDIR /app

# Fix permissions
RUN chown -R pptruser:pptruser /app

# Switch back to pptruser for security
USER pptruser

EXPOSE 3234
CMD ["node", "dist/server.js"]
