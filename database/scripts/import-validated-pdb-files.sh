#!/bin/sh

set -u

# shellcheck disable=SC2153
database=$DATABASE
data_zip_archive=$1

echo 'Importing experimentally validated PDB data.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM validated_pdb;
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
	PRAGMA temp_store = MEMORY;
	CREATE TEMPORARY TABLE import_tmp (
		pdb_name TEXT NOT NULL,
		pdb TEXT NOT NULL,

		UNIQUE(pdb_name)
	);
SQL

for file in "$tmpdir"/*.pdb
do
	pdb_name=${file##*/}
	pdb_name=${pdb_name%.pdb}

	printf "INSERT INTO import_tmp (pdb_name, pdb) VALUES ('%s', readfile('%s'));\n" "$pdb_name" "$file"
done >>"$tmpdir/import.sql"

cat <<-'SQL' >>"$tmpdir/import.sql"
	INSERT INTO validated_pdb (validated_id, pdb)
		SELECT validated_id, pdb
		FROM import_tmp
		JOIN validated ON pdb_name = protein_accession_ncbi
SQL

sqlite3 "$database" <"$tmpdir/import.sql"

echo 'Done.' >&2
