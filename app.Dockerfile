# syntax=docker/dockerfile:1.4
FROM python:3.13-slim AS base

WORKDIR /opt/bacmet/app

COPY app .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

ARG UID=1000
ARG GID=1000
RUN groupadd -g "$GID" python && useradd -u "$UID" -g "$GID" python

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
