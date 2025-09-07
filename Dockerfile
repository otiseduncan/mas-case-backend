# Use Node.js 20 slim image
FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and tsconfig.json
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* tsconfig.json ./

# Install dependencies (skip postinstall to avoid premature build)
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Always generate Prisma client before build
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Run migrations (best effort) and then always start server
CMD ["sh", "-c", "npx prisma migrate deploy ; node dist/server.js"]
