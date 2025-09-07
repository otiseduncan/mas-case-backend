FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 2>/dev/null || true
RUN npm i

COPY . .

RUN npm run build && npx prisma generate

EXPOSE 3000
CMD ["node", "dist/server.js"]
