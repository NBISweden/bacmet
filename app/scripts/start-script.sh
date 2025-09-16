#!/bin/sh -

set -u

export XDG_CONFIG_HOME="$HOME/caddy/config"
export XDG_DATA_HOME="$HOME/caddy/data"

# Create the above directories if they don't exist.
install -d "$XDG_CONFIG_HOME"
install -d "$XDG_DATA_HOME"

caddy start --config ./Caddyfile

if [ "${1-}" = dev ]; then
	# Run development service.
	exec flask --app app/main --debug run --host 0.0.0.0 --port 5000
else
	# Run production service.
	exec gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000
fi
