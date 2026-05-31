# -----------------------
# 1. Build stage
# -----------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install all deps (need dev deps for tsc build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript + copy views/public
RUN npm run build


# -----------------------
# 2. Production stage
# -----------------------
FROM node:24-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]