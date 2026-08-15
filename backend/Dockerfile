FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

FROM base AS dependencies

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

FROM base AS production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodeapp:nodeapp . .

ENV NODE_ENV=production
ENV PORT=5000

USER nodeapp

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:5000/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]