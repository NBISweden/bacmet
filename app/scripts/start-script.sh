#!/bin/sh

exec gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000
