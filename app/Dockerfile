# syntax=docker/dockerfile:1.4
FROM python:3.13-alpine AS base

RUN --mount=type=cache,target=/etc/apk/cache \
    apk add caddy

WORKDIR /opt/bacmet

COPY app/app ./app

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.txt

ARG UID=1000
RUN adduser -D -u "$UID" runner

RUN mkdir -m 755 /caddy && chown -R runner /caddy

CMD ./start-script.sh

EXPOSE 8080/tcp


# Development setup
FROM base AS dev

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.dev.txt

COPY --chmod=644 app/caddy/Caddyfile.dev ./Caddyfile
COPY --chmod=755 app/scripts/start-script.dev.sh ./start-script.sh

USER runner


# Production build setup
FROM node:24-alpine as prod-build

WORKDIR /opt/bacmet/frontend
COPY frontend/bacmet/ ./

RUN --mount=type=cache,target=/root/.npm \
	npm ci

RUN npm run build


# Production setup
FROM base AS prod

COPY --from=prod-build /opt/bacmet/frontend/out ./frontend

COPY --chmod=644 app/caddy/Caddyfile ./Caddyfile
COPY --chmod=755 app/scripts/start-script.sh ./start-script.sh

USER runner
