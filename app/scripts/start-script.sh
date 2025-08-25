#!/bin/sh

XDG_DATA_HOME=/caddy caddy run --config ./Caddyfile &
gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000 &

wait
