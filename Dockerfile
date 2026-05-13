# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend
RUN npm run build

# Compile server
RUN npx tsc -p tsconfig.server.json

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled server and built frontend
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist

# Data directory (mounted as a volume)
RUN mkdir -p data

EXPOSE 3001

CMD ["node", "dist-server/index.js"]
