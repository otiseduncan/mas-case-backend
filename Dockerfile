FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and tsconfig.json
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* tsconfig.json ./

# Install dependencies but skip postinstall
RUN npm install --ignore-scripts

# Copy the rest of the source code
COPY . .


# Generate Prisma client before build
RUN npx prisma generate

# Build TypeScript after Prisma client exists
RUN npm run build

# Run migrations + start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
