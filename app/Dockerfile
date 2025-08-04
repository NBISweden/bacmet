# syntax=docker/dockerfile:1.4
FROM python:3.13-alpine AS base

WORKDIR /opt/bacmet/app

COPY app .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

ARG UID=1000
ARG GID=1000
RUN addgroup -g "$GID" python && adduser -D -u "$UID" -G python python

EXPOSE ${APP_PORT:-5000}/tcp


# Development setup
FROM base AS dev

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.dev.txt

USER python
CMD flask --app main --debug run --host 0.0.0.0 --port "${APP_PORT:-5000}"


# Production setup
FROM base AS prod

WORKDIR /opt/bacmet

COPY start-script.sh start-script.sh

USER python
CMD ./start-script.sh
