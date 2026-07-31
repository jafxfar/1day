FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY backend/package.json backend/package.json

RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY backend backend

RUN pnpm --filter @life-os/contracts build && pnpm --filter backend build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/backend/node_modules backend/node_modules
COPY --from=builder /app/backend/package.json backend/package.json
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/packages/contracts packages/contracts

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "backend/dist/server.js"]