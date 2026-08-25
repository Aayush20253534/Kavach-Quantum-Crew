ARG NODE_VERSION=24.19.0
FROM node:${NODE_VERSION}-bookworm-slim AS dependencies

WORKDIR /app
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

# Generation only parses the datasource URL; it does not connect to this placeholder.
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/build npm run prisma:generate \
  && npm cache clean --force

FROM node:${NODE_VERSION}-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Keep the Prisma CLI in the runtime image because container startup applies
# committed migrations before Node starts. Without it, `prisma:migrate:deploy`
# would fail after dev dependencies were pruned.
CMD ["sh", "-c", "npm run prisma:migrate:deploy && exec node src/server.js"]
