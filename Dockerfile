# Stage 1: Build the frontend and install dependencies
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3 (native modules)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:22-alpine
WORKDIR /app

# Copy built assets and server code
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/db.ts ./

# Install tsx globally to run the server.ts file
RUN npm install -g tsx

# Create a directory for the persistent database
RUN mkdir -p /app/data

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/savings.db

EXPOSE 3000

CMD ["tsx", "server.ts"]
