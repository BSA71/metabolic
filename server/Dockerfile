FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --workspace server --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
WORKDIR /app/server
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/package.json ./package.json
COPY --from=deps /app/server/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "dist/index.js"]
