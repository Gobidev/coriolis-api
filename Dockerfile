# syntax=docker/dockerfile:1.7

# ---- Build stage: clone Coriolis sources and bundle the API ----
FROM node:22-alpine AS build

RUN apk add --no-cache git

WORKDIR /build
COPY . .
RUN sh build.sh

# ---- Runtime stage: only Node and the bundled API are needed ----
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=7777 \
    HOST=0.0.0.0 \
    CONVERSIONS_FILE=/data/conversions.json

WORKDIR /app
COPY --from=build --chown=node:node /build/coriolis-api.js ./

RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

USER node
EXPOSE 7777

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||7777)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "coriolis-api.js"]
