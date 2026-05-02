FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/ 

RUN npm install

COPY . .

RUN SKIP_ENV_VALIDATION=1 npx prisma generate --schema ./prisma/schema

RUN SKIP_ENV_VALIDATION=1 DATABASE_URL="postgresql://stub" npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]