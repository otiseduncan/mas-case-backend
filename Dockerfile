FROM node:20-bookworm-slim

WORKDIR /app

# Copy everything up front (including tsconfig.json and src/)
COPY . .

# Install dependencies (this will also run postinstall if defined)
RUN npm install

# Build explicitly (in case postinstall was skipped in some environments)
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/server.js
