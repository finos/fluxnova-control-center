ARG DOCKER_REGISTRY=docker.io

FROM ${DOCKER_REGISTRY}/alpine:3

ARG ALPINE_REGISTRY=https://dl-cdn.alpinelinux.org/alpine

ENV NODE_ENV=production \
    no_proxy=localhost,169.254.169.254,172.17.0.1 \
    NO_PROXY=localhost,169.254.169.254,172.17.0.1 \
    container=docker

RUN ALPINE_VERSION=$(cat /etc/alpine-release | cut -d'.' -f1,2) && \
    echo "${ALPINE_REGISTRY}/v${ALPINE_VERSION}/main/" > /etc/apk/repositories && \
    echo "${ALPINE_REGISTRY}/v${ALPINE_VERSION}/community/" >> /etc/apk/repositories
RUN apk add --no-cache nodejs && rm -fr /var/cache/apk/*
RUN addgroup -g 1001 node && adduser -u 1001 -G node -s /bin/sh -D node

USER node

WORKDIR /app

# Ordered by frequency of changes (least frequently changed first)
COPY scripts/dockerfile-entrypoint.sh /entrypoint.sh
COPY dist/apps/frontend /app/frontend
COPY dist/apps/server /app/server

# Make node the owner of the server
USER root
RUN chown -R node:node /app/server
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
