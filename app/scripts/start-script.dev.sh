#!/bin/sh

XDG_DATA_HOME=/caddy caddy run --config ./Caddyfile &
flask --app app/main --debug run --host 0.0.0.0 --port 5000 &

wait
