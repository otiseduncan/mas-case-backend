# Use Node.js 20 slim image
FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and tsconfig.json first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* tsconfig.json ./

# Install dependencies but skip postinstall to avoid premature builds
RUN npm install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Generate Prisma client BEFORE TypeScript build
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# Run migrations and then start the Fastify server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
