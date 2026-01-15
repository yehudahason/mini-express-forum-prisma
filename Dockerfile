WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4444

EXPOSE 4444

CMD ["npm", "run", "dev"]