FROM alpine:latest

RUN apk add npm python3 git nodejs

COPY . /coriolis-api
WORKDIR /coriolis-api

RUN ./build.sh

CMD ["node", "coriolis-api.js"]
