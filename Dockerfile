# syntax=docker/dockerfile:1

FROM oven/bun:1.2.20-alpine AS build
WORKDIR /app

ENV CI=docker

COPY package.json bun.lock ./
COPY packages packages
COPY apps apps

RUN bun install --frozen-lockfile \
  && cd packages/inertia-server && bun run build \
  && cd ../inertia-hono && bun run build \
  && cd ../../apps/playground && bun run build

FROM oven/bun:1.2.20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYGROUND_PORT=3000

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/playground ./apps/playground

EXPOSE 3000

CMD ["bun", "run", "apps/playground/src/index.ts"]
