#!/bin/sh

PATH=$HOME/scripts:$PATH

# The database is created if it does not exist, and recreated if
# the environment variable DATABASE_REINIT is set to some value.

if [ ! -f "$DATABASE" ] || [ -n "${DATABASE_REINIT:-}" ]
then
	echo 'Initializing database.' >&2
	rm -f "$DATABASE"
	sqlite3 "$DATABASE" <sql/schema.sql
fi

import-experimentally_validated.sh \
	/data-import/1-Experimentally_validated/Experimentally_validated_PDB_files.zip

import-predicted_unique_homologues.sh \
	/data-import/2-Predicted_database/1-Predicted_unique_homologues.zip
