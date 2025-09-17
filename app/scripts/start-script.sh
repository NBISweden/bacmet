#!/bin/sh -

set -u

export XDG_CONFIG_HOME="$HOME/caddy/config"
export XDG_DATA_HOME="$HOME/caddy/data"

# Create the above directories if they don't exist.
install -d "$XDG_CONFIG_HOME"
install -d "$XDG_DATA_HOME"

caddy start --config ./Caddyfile

export DATABASE="$HOME/data/database.db"
export IMPORT_DIR="$HOME/data/data-import"

while true; do
	if [ ! -s "$DATABASE" ]; then
		# If the database file does not exist, import data.
		echo 'Database file does not exist, importing data.' >&2
		do_import=true
	elif [ -d "$IMPORT_DIR" ]; then
                # If the import directory exists, import data.  This
                # allows users to drop new data into the import
                # directory to replace the existing database.
		echo 'Import directory exists, (re-)importing data.' >&2
		do_import=true
	fi

	if "${do_import:-false}"; then
		# Wait for the import directory to exist.
		while [ ! -d "$IMPORT_DIR" ]; do
			printf 'Waiting for import directory "%s" to exist...\n' \
				"$IMPORT_DIR" >&2
			sleep 5
		done

                # Sleep for 30 seconds to give data a chance to be
                # copied in.
		echo 'Sleeping for 30s...' >&2
		sleep 30

                # Import data into a temporary database, then switch it
                # to be the active one.  Also, remove the uploaded raw
                # data.
		DATABASE=$DATABASE.new db-scripts/scripts/import-all.sh
		mv "$DATABASE.new" "$DATABASE"
		rm -rf "$IMPORT_DIR"

		unset -v do_import

		# Restart the service if it is running.
		if [ -n "${service_pid-}" ] && kill -0 "$service_pid" 2>/dev/null
		then
			echo 'Restarting service...' >&2
			kill "$service_pid"
			wait "$service_pid"
		fi
		unset -v service_pid
	fi

	# Start the service if it is not running.
	if [ -z "${service_pid-}" ] || ! kill -0 "$service_pid" 2>/dev/null
	then
		echo 'Starting service...' >&2

		if [ "${1-}" = dev ]; then
			# Run development service.
			flask --app app/main --debug run --host 0.0.0.0 --port 5000 &
		else
			# Run production service.
			gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000 &
		fi
		service_pid=$!
	fi

	sleep 60
done
