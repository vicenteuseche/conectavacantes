# Etapa 1: Construcción del frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Imagen de ejecución
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && npm install -g tsx

COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/8fcO.ts ./server.ts

EXPOSE 8080
CMD ["tsx", "server.ts"]