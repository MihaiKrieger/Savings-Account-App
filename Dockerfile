# Stage 1: Build & Compile
FROM node:22-slim AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (Debian glibc uses prebuilt binaries for better-sqlite3, avoiding slow C++ compilation)
RUN npm ci

COPY . .

# Build the application (compiles client assets and bundles the server into dist/server.cjs)
RUN npm run build

# Prune devDependencies to keep node_modules strictly lightweight for production
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:22-slim

WORKDIR /app

# Ensure data directory exists for persistent SQLite database volumes
RUN mkdir -p /app/data

# Copy package metadata, production-only node_modules, and compiled server/client files
COPY package.json metadata.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Container health probe using native Node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Execute using native Node directly (bypassing npm overhead to save memory and CPU)
CMD ["node", "dist/server.cjs"]

