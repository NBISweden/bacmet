#!/bin/sh -

env UID="$(id -u)" GID="$(id -g)" \
	docker compose -f docker-compose.yml "$@"
