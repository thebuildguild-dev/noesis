FROM node:20

WORKDIR /app

# Install dependencies first (cached layer — only re-runs when package.json changes)
COPY package*.json ./
RUN npm install

# Copy source so the image can be used standalone (without a volume mount)
COPY . .

# Place the entrypoint outside /app so the runtime volume mount (./frontend:/app)
# does not shadow it. The script must survive the volume override.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Vite dev server port
EXPOSE 5173

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
