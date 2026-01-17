ARG BUILD_TARGET="prod"

FROM oven/bun:1 AS base

WORKDIR /app

# Copy workspace files
COPY . ./

# Install dependencies
RUN bun install --linker=isolated



RUN bun nx copy-workspace-modules public-api --${BUILD_TARGET}


# ==============================================================================
# Stage 2: Production Runtime
FROM oven/bun:1 AS release

WORKDIR /app

# Copy built artifacts from builder
COPY --from=base --chown=bun:nodesjs /app/apps/public-api/dist ./dist
#
WORKDIR /app/dist

# Hack to get around NX configuration which due to time restructions I didn't manage to w
RUN mv workspace_modules/\@lobster-shop/shared workspace_modules/
RUN bun install --linker=isolated --frozen-lockfile

USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3000/api/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["bun", "run", "main.js"]