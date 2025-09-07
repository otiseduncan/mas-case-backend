FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy everything up front (including tsconfig.json and src/)
COPY . .

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/server.js
