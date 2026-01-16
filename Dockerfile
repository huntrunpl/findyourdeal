FROM node:20-alpine

WORKDIR /app

# kopiujemy package.json i package-lock.json z katalogu api
COPY api/package*.json ./api/

WORKDIR /app/api
RUN npm install --omit=dev

# kopiujemy cały kod api + worker
COPY api/ /app/api/
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "index.js"]
