#!/bin/sh

XDG_DATA_HOME=/caddy caddy start --config ./Caddyfile
exec flask --app app/main --debug run --host 0.0.0.0 --port 5000
