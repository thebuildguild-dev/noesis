# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve static files
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

ENV CONFIG_TARGET=dist

RUN npm install -g serve

# Place the entrypoint outside /app so volume mounts cannot shadow it
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "5173"]
