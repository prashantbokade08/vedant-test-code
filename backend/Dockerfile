# ============================================================
# Base image
# ============================================================

FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Create non-root user
RUN addgroup -S nodeapp \
    && adduser -S nodeapp -G nodeapp


# ============================================================
# Dependencies
# ============================================================

FROM base AS dependencies

COPY package.json package-lock.json ./

# Install production dependencies only
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts


# ============================================================
# Production
# ============================================================

FROM base AS production

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy backend application
COPY --chown=nodeapp:nodeapp . .

# Remove unnecessary package managers
RUN rm -rf \
    /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/corepack \
    /opt/yarn-v1.22.22

# Run as non-root user
USER nodeapp

# Backend port
EXPOSE 5000

# ============================================================
# Container health check
# ============================================================

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=15s \
    --retries=3 \
    CMD node -e "\
      require('http').get(\
        'http://127.0.0.1:5000/health',\
        (r) => process.exit(r.statusCode === 200 ? 0 : 1)\
      ).on('error', () => process.exit(1))"

# ============================================================
# Start backend
# ============================================================

CMD ["node", "server.js"]