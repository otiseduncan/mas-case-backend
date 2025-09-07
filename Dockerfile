FROM node:20-bookworm-slim

WORKDIR /app

# Copy package files and tsconfig first
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* tsconfig.json ./

# Install dependencies (this will run postinstall automatically)
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build explicitly (in case postinstall was skipped)
RUN npm run build

CMD npx prisma migrate deploy && node dist/server.js
