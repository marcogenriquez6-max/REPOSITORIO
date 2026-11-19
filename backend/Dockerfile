FROM node:20-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY backend/package*.json ./
EXPOSE 8080
CMD ["node", "dist/app.js"]
