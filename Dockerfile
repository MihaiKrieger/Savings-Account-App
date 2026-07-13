# Stage 1: Build & Compile
FROM node:22-alpine AS builder

# Install build essentials for native better-sqlite3 compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

COPY . .

# Build the application (compiles client assets and bundles the server into dist/server.cjs)
RUN npm run build

# Prune devDependencies to keep node_modules strictly lightweight for production
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:22-alpine

WORKDIR /app

# Copy package metadata, production-only node_modules, and compiled server/client files
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Execute using native Node directly (bypassing npm overhead to save memory and CPU)
CMD ["node", "dist/server.cjs"]
