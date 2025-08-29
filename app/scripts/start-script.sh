#!/bin/sh

caddy run --config ./Caddyfile &
gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000 &

wait
