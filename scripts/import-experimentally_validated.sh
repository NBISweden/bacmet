#!/bin/sh

set -u

database=$DATABASE
data_zip_archive=$1

echo 'Importing experimentally validated data.' >&2

if [ ! -f "$database" ]; then
	printf 'Database "%s" not found\n' "$database" >&2
	exit 1
fi

count=$(
	sqlite3 "$database" <<-'SQL'
		SELECT COUNT(*) FROM experimentally_validated;
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
echo 'BEGIN TRANSACTION;' >"$tmpdir"/insert.sql
for file in "$tmpdir"/*.pdb
do
	pdb_id=${file##*/}
	pdb_id=${pdb_id%.pdb}

	printf "INSERT INTO experimentally_validated (pdb_id, data) VALUES ('%s', readfile('%s'));\n" "$pdb_id" "$file"
done >>"$tmpdir"/insert.sql
echo 'COMMIT;' >>"$tmpdir"/insert.sql

sqlite3 "$database" <"$tmpdir"/insert.sql

echo 'Done.' >&2
