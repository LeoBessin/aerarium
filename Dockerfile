# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install all dependencies (tsx needed at runtime)
COPY package*.json ./
RUN npm ci

# Copy server source and shared types
COPY server/ ./server/
COPY src/types/ ./src/types/

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Data directory (mounted as a volume)
RUN mkdir -p data

EXPOSE 3001

CMD ["node", "--import", "tsx/esm", "server/src/index.ts"]
