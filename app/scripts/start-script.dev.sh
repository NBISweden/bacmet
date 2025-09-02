#!/bin/sh -

set -u

export XDG_CONFIG_HOME="$HOME/caddy/config"
export XDG_DATA_HOME="$HOME/caddy/data"

# Create the above directories if they don't exist.
install -d "$XDG_CONFIG_HOME"
install -d "$XDG_DATA_HOME"

caddy start --config ./Caddyfile
exec flask --app app/main --debug run --host 0.0.0.0 --port 5000
