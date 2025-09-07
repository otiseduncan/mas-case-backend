FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install

# Now copy the rest of the code, including tsconfig.json and src/
COPY . .

# Build
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

CMD npx prisma migrate deploy && node dist/server.js
