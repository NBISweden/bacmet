#!/bin/sh

set -u

database=$DATABASE
data_zip_archive=$1

echo 'Importing predicted groups.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM predicted_groups;
	SQL
)

if [ "$count" -gt 0 ]; then
	echo 'Data is already loaded.' >&2
	exit 0	# not an error
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
echo 'Extracting Zip archive...' >&2
unzip -q -d "$tmpdir" "$data_zip_archive"

echo 'Loading files into database...' >&2
echo '.mode csv' >"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		BLAST_hit_genome TEXT NOT NULL,
		sequence TEXT NOT NULL,
		matching_id_list TEXT NOT NULL
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir"/*.csv >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO predicted_groups (BLAST_hit_genome_id, sequence, matching_id_list)
	SELECT BLAST_hit_genome_id, sequence, matching_id_list
	FROM import_tmp
	JOIN predicted_unique_homologues
	USING (BLAST_hit_genome);
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
