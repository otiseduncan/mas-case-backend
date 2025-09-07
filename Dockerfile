FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package and lock files first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Only run migrations + start server at runtime
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
