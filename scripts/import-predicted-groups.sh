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

cat <<-'SQL' >"$tmpdir/import.sql"
	.mode csv
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		unique_id TEXT NOT NULL,
		sequence TEXT NOT NULL,
		matching_ids TEXT NOT NULL,

		UNIQUE(unique_id)
	);
SQL

printf '.import --skip 1 %s import_tmp\n' "$tmpdir"/*.csv >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	DELETE FROM sequences;
	INSERT INTO sequences (sequence)
	SELECT DISTINCT sequence
	FROM import_tmp;
SQL
cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO predicted_groups (
		predicted_unique_homologue_id, sequence_id, matching_ids
	)
	SELECT predicted_unique_homologue_id, sequence_id, matching_ids
	FROM import_tmp
	JOIN predicted_unique_homologues
		ON import_tmp.unique_id = predicted_unique_homologues.blast_hit_genome
	JOIN sequences
		ON import_tmp.sequence = sequences.sequence;
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
