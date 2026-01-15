FROM node:24-bookworm-slim

WORKDIR /app

# Install deps first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema and generate client
# (Prisma expects prisma/schema.prisma by default)
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the app
COPY . .

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4444

EXPOSE 4444

CMD ["npm", "run", "dev"]
