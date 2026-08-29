FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY server/schema.sql ./schema.sql
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
