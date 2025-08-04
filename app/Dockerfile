# syntax=docker/dockerfile:1.4
FROM python:3.13-alpine AS base

WORKDIR /opt/bacmet

COPY ./app ./app

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.txt

ARG UID=1000
RUN adduser -D -u "$UID" python

EXPOSE 5000/tcp


# Development setup
FROM base AS dev

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r app/requirements.dev.txt

USER python
CMD flask --app app/main --debug run --host 0.0.0.0 --port 5000


# Production setup
FROM base AS prod

COPY scripts/start-script.sh ./start-script.sh

USER python
CMD ./start-script.sh
