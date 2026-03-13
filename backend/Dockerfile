FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Place the entrypoint outside /app so the runtime volume mount (./backend:/app)
# does not shadow it. The script must survive the volume override.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
