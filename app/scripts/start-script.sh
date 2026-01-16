#!/bin/sh -

set -u

service_mode=${1-}

volume=$HOME/vol

export XDG_CONFIG_HOME="$volume/.caddy/config"
export XDG_DATA_HOME="$volume/.caddy/data"

export IMPORT_DIR="$volume/data-import"

# Create the above directories if they don't exist.
mkdir -p "$XDG_CONFIG_HOME"
mkdir -p "$XDG_DATA_HOME"

mkdir -p "$IMPORT_DIR"

start_service() {
	# Start the service if it is not running.
	
	if [ ! -f "$DATABASE" ]; then
		echo 'Initializing database.' >&2
		sqlite3 "$DATABASE" <"$HOME/db-scripts/sql/schema.sql"
	fi

	if [ -z "${service_pid-}" ] || ! kill -0 "$service_pid" 2>/dev/null
	then
		echo 'Starting service...' >&2

		if [ "$service_mode" = dev ]; then
			# Run development service.
			flask --app app/main --debug run --host 0.0.0.0 --port 5000 &
		else
			# Run production service.
			gunicorn -w "${APP_WORKERS:-4}" app:app -b 0.0.0.0:5000 &
		fi
		service_pid=$!
	fi
}

caddy start --config ./Caddyfile

export DATABASE="$volume/database.db"

export APP_DATABASE_CONFIG="sqlite:///$DATABASE"

start_service

while true; do
	if [ ! -s "$DATABASE" ]; then
		# If the database file does not exist, import data.
		echo 'Database file does not exist, importing data.' >&2
		do_import=true
	elif [ -d "$IMPORT_DIR" ]; then
		# If the import directory exists, we need to check if
		# any of the data is newer than the MD5 checksum file.
		# If it is newer, we need to test the data against the
		# checksum file, and if it *fails* the test, we need to
		# import the data.
		if [ ! -f "$IMPORT_DIR.md5" ]; then
			echo 'No checksum file found, importing data.' >&2
			do_import=true
		elif find "$IMPORT_DIR" -newer "$IMPORT_DIR.md5" | grep -q .
		then
			echo 'Possibly fresh data found, verifying...' >&2
			if ! md5sum -c "$IMPORT_DIR.md5"; then
				echo 'Data verification failed, importing data.' >&2
				do_import=true
			else
				echo 'Data unchanged, skipping import.' >&2
				touch "$IMPORT_DIR.md5"
			fi
		fi
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

		# Bail out if there is no data to import.
		set -- "$IMPORT_DIR"/*
		if [ ! -e "$1" ]; then
			echo 'No data found to import, skipping.' >&2
			unset -v do_import
			continue
		fi

		# Import data into a temporary database, then switch it
		# to be the active one if the data did not change during
		# the import.
		find "$IMPORT_DIR" -type f -exec md5sum {} + | sort -o "$IMPORT_DIR.md5-before"
		DATABASE=$DATABASE.new db-scripts/scripts/import-all.sh
		find "$IMPORT_DIR" -type f -exec md5sum {} + | sort -o "$IMPORT_DIR.md5-after"

		if ! cmp -s "$IMPORT_DIR.md5-before" "$IMPORT_DIR.md5-after"
		then
			echo 'Data changed during import, retrying...' >&2
			rm -f "$DATABASE.new"
			rm -f "$IMPORT_DIR.md5-before" "$IMPORT_DIR.md5-after"
			continue
		fi
		mv "$DATABASE.new" "$DATABASE"
		rm -f "$IMPORT_DIR.md5-before"
		mv "$IMPORT_DIR.md5-after" "$IMPORT_DIR.md5"

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

	start_service

	sleep 60
done
