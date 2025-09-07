FROM node:20-alpine AS base
WORKDIR /app


# Copy only dependency files first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN npm install

COPY . .

RUN npx tsc -p tsconfig.json && npx prisma generate

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
