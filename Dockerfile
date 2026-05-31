# --- Stage 1: Build ---
FROM node:24-slim AS builder
WORKDIR /usr/src/app

# Install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production ---
FROM node:24-slim

WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# IMPORTANT: Copy the generated Prisma Client from the builder
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy the compiled dist folder
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]