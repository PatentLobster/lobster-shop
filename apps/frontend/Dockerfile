ARG ENV_BUILD_TARGET="prod"
# Stage 1: Builder
FROM oven/bun:1 AS base

WORKDIR /app

COPY . ./

# Install dependencies
RUN bun install --linker=isolated


RUN bun nx build frontend

# ==============================================================================
# Stage 2: Production Runtime with Nginx
FROM nginx:alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S nginx-custom && \
    adduser -S nginx-custom -u 1001 && \
    chown -R nginx-custom:nginx-custom /var/cache/nginx && \
    chown -R nginx-custom:nginx-custom /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-custom:nginx-custom /var/run/nginx.pid

# Copy built assets from builder
COPY --from=base /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Security: Use non-root user
USER nginx-custom

# Expose port (non-privileged)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]