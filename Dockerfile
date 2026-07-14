# syntax=docker/dockerfile:1

# ---- 1. Compilar el frontend (Vite → client/dist) ----
FROM node:20-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ---- 2. Instalar dependencias del backend (compila better-sqlite3) ----
FROM node:20-bookworm-slim AS server-deps
WORKDIR /app/server
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY server/package*.json ./
RUN npm install --omit=dev

# ---- 3. Imagen final ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data
WORKDIR /app

# Dependencias y código del backend
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Build del frontend servido por Express
COPY --from=client-build /app/client/dist ./client/dist

# Carpeta de datos (montá un volumen aquí en EasyPanel para persistir la DB)
RUN mkdir -p /app/data

EXPOSE 3000
WORKDIR /app/server
CMD ["node", "src/index.js"]
