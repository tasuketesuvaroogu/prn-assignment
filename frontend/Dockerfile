FROM node:20-alpine AS base

ENV CI="Docker"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# Build stage
FROM base AS builder

# copy package files and lockfile
COPY package.json pnpm-lock.yaml ./
COPY vite.config.* tsconfig.json qwik.env.d.ts ./

# install dependencies (uses pnpm via corepack)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# copy source and build
COPY src ./src
COPY public ./public
COPY index.html ./

RUN pnpm run build

FROM base AS production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

ENV PORT=5244

EXPOSE 5244

CMD ["node", "server/entry.fastify.js"]