# ========================================
# IMF Test Manager Docker Configuration
# ========================================

# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# ========================================
# Production Stage
# ========================================

FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S imftest -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy additional files
COPY examples/ ./examples/
COPY scripts/ ./scripts/

# Create data directories
RUN mkdir -p /app/profiles /app/output /app/results /app/logs && \
    chown -R imftest:nodejs /app

# Switch to non-root user
USER imftest

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=INFO
ENV PROFILES_DIR=/app/profiles
ENV OUTPUT_DIR=/app/output
ENV RESULTS_DIR=/app/results
ENV LOG_DIR=/app/logs

# Expose port for potential HTTP API
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/cli.js status || exit 1

# Entry point
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/cli.js", "--help"]

# ========================================
# Development Stage
# ========================================

FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache git bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/
COPY examples/ ./examples/
COPY scripts/ ./scripts/

# Create data directories
RUN mkdir -p /app/profiles /app/output /app/results /app/logs

# Set environment variables
ENV NODE_ENV=development
ENV LOG_LEVEL=DEBUG

# Expose port for development server
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]

# ========================================
# Testing Stage
# ========================================

FROM development AS testing

# Run tests
RUN npm test

# Run linting
RUN npm run lint || true

# Run type checking
RUN npm run build

# Default command for testing
CMD ["npm", "test"]