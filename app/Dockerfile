# syntax=docker/dockerfile:1.4
FROM python:3.13-alpine AS base

RUN --mount=type=cache,target=/etc/apk/cache \
    apk add caddy

WORKDIR /opt/bacmet

COPY ./app ./app

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.txt

ARG UID=1000
RUN adduser -D -u "$UID" python

RUN mkdir -m 755 /caddy && chown -R python /caddy

CMD ./start-script.sh

EXPOSE 8080/tcp


# Development setup
FROM base AS dev

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.dev.txt

COPY --chmod=644 caddy/Caddyfile.dev ./Caddyfile
COPY --chmod=755 scripts/start-script.dev.sh ./start-script.sh

USER python


# Production setup
FROM base AS prod

COPY --chmod=644 caddy/Caddyfile ./Caddyfile
COPY --chmod=755 scripts/start-script.sh ./start-script.sh

USER python
