FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data PRELOAD_CATALOG_ON_START=true
COPY --from=build /app/package.json ./package.json
RUN apk add --no-cache python3 make g++ && npm install --omit=dev && apk del python3 make g++
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data
LABEL org.opencontainers.image.source="https://github.com/vitornobrega/bettingdashboard"
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node","server/index.js"]