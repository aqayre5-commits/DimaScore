FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild
COPY . .
WORKDIR /app/workers/live-poller
CMD ["/app/node_modules/.bin/tsx", "src/index.ts"]
