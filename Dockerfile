FROM node:20-bookworm-slim

# Install OpenSSL (Prisma detects this reliably on Debian)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first for better caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN npm install

# Copy the app source
COPY . .

# Generate Prisma client BEFORE TypeScript build so types are available
RUN npx prisma generate

# Build TypeScript
RUN npx tsc -p tsconfig.json

ENV NODE_ENV=production
EXPOSE 3000

# Run DB migrations on boot, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
