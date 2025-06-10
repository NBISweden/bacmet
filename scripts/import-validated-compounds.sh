#!/bin/sh

set -u

database=$DATABASE
data_csv_file=$1

echo 'Importing experimentally validated compounds.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM compounds;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
# This data needs to be preprocessed to remove empty records
# and internal headers.
awk 'NR == 1 || !(/,,,/ || /CAS Number,Chemical Class/)' \
	"$data_csv_file" >"$tmpdir/data.csv"

echo 'Loading data into database...' >&2

cat <<-'SQL' >"$tmpdir/import.sql"
	.mode csv
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		compound_name TEXT NOT NULL,
		cas_number TEXT NOT NULL,
		chemical_class TEXT NOT NULL,
		description TEXT NOT NULL,

		UNIQUE(compound_name)
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir/data.csv" >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO compounds (
		compound_name, cas_number, chemical_class, description
	)
	SELECT 
		compound_name, cas_number, chemical_class, description
	FROM import_tmp;
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
