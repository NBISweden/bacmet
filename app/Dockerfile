# syntax=docker/dockerfile:1.4
FROM python:3.13-alpine AS base

# The "base" target only installs dependencies common to both
# development and production images, sets up a non-root user,
# and defines the default command.

ARG UID=1000

RUN adduser -D -u "$UID" bacmet

RUN --mount=type=cache,target=/etc/apk/cache \
	apk add caddy

WORKDIR /home/bacmet

# The caddy and data volume mount points.
RUN install -d -o "$UID" caddy/ data/

# Other important directories that need to be owned by our service user.
RUN install -d -o "$UID" app/ frontend/

# Install Python dependencies.
COPY --chmod=444 app/app/requirements.txt app/
RUN --mount=type=cache,target=/root/.cache/pip \
	pip install -r app/requirements.txt

# The start script will be copied here in later build stages.
CMD ./start-script.sh

EXPOSE 8080/tcp


## Development setup
FROM base AS dev

# The "dev" target adds development dependencies and configuration.
# The REST API code is added via a bind mount by the compose file.

ARG UID=1000

# Install developent Python dependencies.
COPY --chmod=444 app/app/requirements.dev.txt app/
RUN --mount=type=cache,target=/root/.cache/pip \
	pip install -r app/requirements.dev.txt

COPY --chown=$UID --chmod=444 app/caddy/Caddyfile.dev ./Caddyfile
COPY --chown=$UID --chmod=555 app/scripts/start-script.dev.sh ./start-script.sh

USER "$UID"


## Production build setup
FROM node:24-alpine as prod-build

# The "prod-build" target builds the frontend assets.  It does not
# include code or configuration.

ARG UID=1000

ENV NEXT_TELEMETRY_DISABLED 1

RUN install -d -o "$UID" /tmp/build /tmp/build/.npm

WORKDIR /tmp/build

# Set up the Node build directories so that we can build everything as
# our service user later.
RUN --mount=type=cache,target=/tmp/build/.npm \
    --mount=type=cache,target=/tmp/build/node_modules \
	chown -R "$UID" /tmp/build/

# Switch to the service user as the rest of the RUN actions shouldn't
# require root access.
USER "$UID"

COPY --chown=$UID --chmod=444 frontend/bacmet/package*.json ./
RUN --mount=type=cache,target=/tmp/build/.npm \
    --mount=type=cache,target=/tmp/build/node_modules \
	npm --cache=/tmp/build/.npm ci

COPY --chown=$UID frontend/bacmet/ ./
RUN --mount=type=cache,target=/tmp/build/.npm \
    --mount=type=cache,target=/tmp/build/node_modules \
	npm --cache=/tmp/build/.npm run build


## Production setup
FROM base AS prod

# The "prod" target adds REST API code, production configuration, and
# copies in the built frontend assets.

ARG UID=1000

# Copy the static content from the previous build step.
COPY --chown=$UID --from=prod-build /tmp/build/out ./frontend/

COPY --chown=$UID --chmod=444 app/caddy/Caddyfile ./Caddyfile
COPY --chown=$UID --chmod=555 app/scripts/start-script.sh ./start-script.sh

# Copy the REST API code last to maximize use of Docker layer caching.
COPY --chown=$UID app/app ./app/

USER "$UID"
