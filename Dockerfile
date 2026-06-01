# --- Stage 1: build del frontend ---
FROM node:22.3.0-bookworm-slim AS client-build
WORKDIR /build

# Copiamos solo los manifests primero para aprovechar cache de capas.
COPY client/package.json client/package-lock.json ./
RUN npm ci

# Después el código y buildeamos.
COPY client/ ./
RUN npm run build

# --- Stage 2: runtime ---
FROM node:22.3.0-bookworm-slim
WORKDIR /app

# Dependencias del server (solo prod). better-sqlite3 trae prebuilt
# para Node 22 + Linux glibc, así que no necesitamos compilarlo.
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Código del server
COPY server ./server

# Frontend buildeado del stage anterior
COPY --from=client-build /build/dist ./client/dist

ENV NODE_ENV=production
ENV DB_PATH=/data/finanzas.db
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/server.js"]
