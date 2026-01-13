FROM node:20-alpine

WORKDIR /app

# kopiujemy package.json i package-lock.json z katalogu api
COPY api/package*.json ./api/

WORKDIR /app/api
RUN npm install --omit=dev

# kopiujemy cały kod api + worker
COPY api/ /app/api/

CMD ["npm", "run", "start"]
