FROM node:20-alpine AS base

ENV CI="Docker"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# Build stage
FROM base AS builder

COPY package.json pnpm-lock.yaml ./
COPY vite.config.* tsconfig.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY src ./src
COPY index.html ./

RUN pnpm run build

# Production stage
FROM base AS production

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add -g serve

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 5244

CMD ["serve", "-s", "dist", "-l", "5244"]