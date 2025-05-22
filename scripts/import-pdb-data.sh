#!/bin/sh

set -u

# This script imports PDB files from
# "Experimentally_validated_PDB_files.zip"
# into an SQLite database.

database=$DATABASE
data_zip_archive=$1

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM pdb
	SQL
)

if [ "$count" -gt 0 ]; then
	printf 'Database "%s" already contains data\n' "$database" >&2
	exit 1
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT INT TERM
echo 'Extracting PDB files...' >&2
unzip -q -d "$tmpdir" "$data_zip_archive"

echo 'Loading PDB files into database...' >&2
echo 'BEGIN TRANSACTION;' >"$tmpdir"/insert.sql
for pdb in "$tmpdir"/*.pdb
do
	pdb_id=${pdb##*/}
	pdb_id=${pdb_id%.pdb}

	printf "INSERT INTO pdb (pdb_id, data) VALUES ('%s', readfile('%s'));\n" "$pdb_id" "$pdb"
done >>"$tmpdir"/insert.sql
echo 'COMMIT;' >>"$tmpdir"/insert.sql

sqlite3 "$database" <"$tmpdir"/insert.sql

echo 'Done.' >&2
